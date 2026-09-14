import { NextRequest, NextResponse } from "next/server";
import { CHANNELS } from "@/config/channels";
import { fetchFullChannelData } from "@/lib/youtube";
import { analyzeVideo, generateMarketInsight } from "@/lib/ai-analysis";
import { calculateActivityStatus, countUploadsInWindow } from "@/lib/activity";
import { getSupabaseAdminClient } from "@/lib/supabase";

// ============================================================
// 금융사 YouTube 자동 동기화 API
//
// 1. 전체 금융사 YouTube 채널 확인
// 2. 채널 통계 + 최근 영상 가져오기
// 3. Supabase channels 업데이트
// 4. 새 영상만 AI 분석
// 5. Supabase videos 저장
// 6. 새 영상이 있을 때만 AI Market Insight 갱신
//
// AI 비용 절약:
// - 기존 영상은 다시 AI 분석하지 않음
// - 신규 영상이 없으면 Market Insight도 다시 생성하지 않음
//
// OpenAI Rate Limit:
// - 신규 영상 AI 분석 후 7초 대기
// ============================================================

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // ----------------------------------------------------------
  // 0. SYNC_SECRET 확인
  // ----------------------------------------------------------
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdminClient();

  const results: {
    company: string;
    status: string;
    newVideos: number;
  }[] = [];

  // 이번 sync에서 발견된 전체 신규 영상 수
  let totalNewVideos = 0;

  // AI 사용 가능 여부
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  const aiAvailable =
    provider === "openai"
      ? !!process.env.OPENAI_API_KEY
      : !!process.env.ANTHROPIC_API_KEY;

  // ----------------------------------------------------------
  // 1. 금융사 채널 순회
  // ----------------------------------------------------------
  for (const channelConfig of CHANNELS) {
    // 아직 Channel ID가 입력되지 않은 회사는 건너뜀
    if (channelConfig.youtubeChannelId.startsWith("REPLACE_WITH")) {
      results.push({
        company: channelConfig.companyName,
        status: "skipped (no channel id)",
        newVideos: 0,
      });

      continue;
    }

    try {
      // ------------------------------------------------------
      // 2. YouTube 데이터 가져오기
      // ------------------------------------------------------
      const { channelSnapshot, videos } =
        await fetchFullChannelData(channelConfig);

      const publishDates = videos.map(
        (video) => new Date(video.publishedAt)
      );

      const uploads7d = countUploadsInWindow(publishDates, 7);
      const uploads30d = countUploadsInWindow(publishDates, 30);

      const activityStatus = calculateActivityStatus(
        uploads7d,
        uploads30d
      );

      // ------------------------------------------------------
      // 3. channels 테이블 업데이트
      // ------------------------------------------------------
      const { data: channelRow, error: channelError } =
        await supabase
          .from("channels")
          .upsert(
            {
              company_name: channelConfig.companyName,
              channel_name: channelConfig.channelName,
              category: channelConfig.category,
              youtube_channel_id:
                channelConfig.youtubeChannelId,
              thumbnail_url: channelSnapshot.thumbnailUrl,
              subscriber_count:
                channelSnapshot.subscriberCount,
              total_video_count:
                channelSnapshot.videoCount,
              last_upload_at:
                publishDates[0]?.toISOString() ?? null,
              uploads_7d: uploads7d,
              uploads_30d: uploads30d,
              activity_status: activityStatus,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "youtube_channel_id",
            }
          )
          .select()
          .single();

      if (channelError) {
        throw channelError;
      }

      // ------------------------------------------------------
      // 4. 이미 저장되어 있는 영상 확인
      // ------------------------------------------------------
      const videoIds = videos.map(
        (video) => video.videoId
      );

      const { data: existingVideos } = await supabase
        .from("videos")
        .select("youtube_video_id")
        .in("youtube_video_id", videoIds);

      const existingIds = new Set(
        (existingVideos ?? []).map(
          (video) => video.youtube_video_id
        )
      );

      let newVideoCount = 0;

      // ------------------------------------------------------
      // 5. 영상 저장 + 신규 영상 AI 분석
      // ------------------------------------------------------
      for (const video of videos) {
        const isNew = !existingIds.has(video.videoId);

        let aiFields: {
          ai_summary: string | null;
          ai_keywords: string[] | null;
          ai_content_types: string[] | null;
          ai_planning_notes: string | null;
          ai_implication: string | null;
          ai_analyzed_at: string | null;
        } = {
          ai_summary: null,
          ai_keywords: null,
          ai_content_types: null,
          ai_planning_notes: null,
          ai_implication: null,
          ai_analyzed_at: null,
        };

        // ----------------------------------------------------
        // 신규 영상만 AI 분석
        // ----------------------------------------------------
        if (isNew && aiAvailable) {
          try {
            console.log(
              `AI 분석 중: [${channelConfig.companyName}] ${video.title}`
            );

            const analysis = await analyzeVideo({
              title: video.title,
              description: video.description,
              companyName: channelConfig.companyName,
              category: channelConfig.category,
            });

            aiFields = {
              ai_summary: analysis.summary,
              ai_keywords: analysis.keywords,
              ai_content_types: analysis.contentTypes,
              ai_planning_notes: analysis.planningNotes,
              ai_implication: analysis.implication,
              ai_analyzed_at: new Date().toISOString(),
            };

            console.log("AI 분석 완료");
          } catch (aiError) {
            console.error(
              `AI 분석 실패 (${video.videoId}):`,
              aiError
            );

            // AI 분석 실패해도 영상 자체는 저장
          }
        }

        // ----------------------------------------------------
        // videos 테이블 저장
        // ----------------------------------------------------
        const { error: videoError } =
          await supabase
            .from("videos")
            .upsert(
              {
                youtube_video_id: video.videoId,
                channel_id: channelRow.id,
                company_name:
                  channelConfig.companyName,
                category: channelConfig.category,
                title: video.title,
                description: video.description,
                thumbnail_url: video.thumbnailUrl,
                published_at: video.publishedAt,
                duration_seconds:
                  video.durationSeconds,
                is_shorts: video.isShorts,
                view_count: video.viewCount,
                like_count: video.likeCount,
                comment_count: video.commentCount,
                video_url:
                  `https://www.youtube.com/watch?v=${video.videoId}`,

                // 기존 영상의 AI 분석값은 덮어쓰지 않음
                ...(isNew ? aiFields : {}),
              },
              {
                onConflict: "youtube_video_id",
              }
            );

        if (videoError) {
          throw videoError;
        }

        // 신규 영상이면 개수 증가
        if (isNew) {
          newVideoCount++;
          totalNewVideos++;

          // OpenAI Rate Limit 방지
          // 현재 계정 제한이 10 RPM이므로 7초 대기
          if (aiAvailable) {
            await new Promise((resolve) =>
              setTimeout(resolve, 7000)
            );
          }
        }
      }

      results.push({
        company: channelConfig.companyName,
        status: "ok",
        newVideos: newVideoCount,
      });
    } catch (err: any) {
      console.error(
        `채널 동기화 실패 (${channelConfig.companyName}):`,
        err
      );

      results.push({
        company: channelConfig.companyName,
        status: `error: ${err.message}`,
        newVideos: 0,
      });
    }
  }

  // ----------------------------------------------------------
  // 6. 신규 영상이 있을 때만 AI Market Insight 생성
  // ----------------------------------------------------------
  if (aiAvailable && totalNewVideos > 0) {
    try {
      console.log(
        `신규 영상 ${totalNewVideos}개 발견 → Market Insight 생성`
      );

      const { data: recentVideos } =
        await supabase
          .from("videos")
          .select(
            "company_name, title, ai_content_types, category"
          )
          .neq("category", "증권")
          .not("ai_summary", "is", null)
          .order("published_at", {
            ascending: false,
          })
          .limit(60);

      const { data: allChannels } =
        await supabase
          .from("channels")
          .select(
            "company_name, uploads_7d, category"
          )
          .neq("category", "증권");

      const insight =
        await generateMarketInsight({
          periodLabel: "최근 7일",

          recentVideos:
            (recentVideos ?? []).map((video) => ({
              companyName: video.company_name,
              title: video.title,
              contentTypes:
                video.ai_content_types ?? [],
            })),

          channelUploadCounts:
            (allChannels ?? []).map((channel) => ({
              companyName: channel.company_name,
              uploads7d:
                channel.uploads_7d ?? 0,
            })),
        });

      const { error: insightError } =
        await supabase
          .from("market_insights")
          .upsert({
            id: 1,
            generated_at: insight.generatedAt,
            period_label: insight.periodLabel,
            trend_summary: insight.trendSummary,
            most_active_company:
              insight.mostActiveCompany,
            most_active_company_strength:
              insight.mostActiveCompanyStrength,
            common_strategy:
              insight.commonStrategy,
            strategy_differences:
              insight.strategyDifferences,
            rising_topics:
              insight.risingTopics,
            recommendation_for_kyobo:
              insight.recommendationForKyobo,
            caution_trend:
              insight.cautionTrend,
          });

      if (insightError) {
        throw insightError;
      }

      console.log("AI Market Insight 갱신 완료");
    } catch (insightError) {
      console.error(
        "AI Market Insight 생성 실패:",
        insightError
      );

      // Insight 실패 때문에 전체 sync를 실패시키지는 않음
    }
  } else if (!aiAvailable) {
    console.log(
      "AI API 키가 없어 Market Insight 생성을 건너뜁니다."
    );
  } else {
    console.log(
      "신규 영상이 없어 Market Insight 갱신을 건너뜁니다."
    );
  }

  // ----------------------------------------------------------
  // 7. 결과 반환
  // ----------------------------------------------------------
  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    aiAnalysisEnabled: aiAvailable,
    totalChannels: CHANNELS.length,
    totalNewVideos,
    marketInsightUpdated:
      aiAvailable && totalNewVideos > 0,
    results,
  });
}