import { getSupabaseClient } from "@/lib/supabase";
import type { Channel, MarketInsight, Video } from "@/types";

// ============================================================
// Supabase의 snake_case 컬럼을 타입스크립트의 camelCase 필드로 바꿔주는
// "읽기 전용" 헬퍼들입니다. 화면(components)에서는 이 함수들만 쓰면 되고,
// Supabase 쿼리 문법을 몰라도 됩니다.
// ============================================================

export async function getAllChannels(): Promise<Channel[]> {
  const supabase = getSupabaseClient();
const { data, error } = await supabase
  .from("channels")
  .select("*")
  .neq("category", "증권")
  .order("uploads_7d", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    companyName: row.company_name,
    channelName: row.channel_name,
    category: row.category,
    youtubeChannelId: row.youtube_channel_id,
    thumbnailUrl: row.thumbnail_url,
    subscriberCount: row.subscriber_count,
    totalVideoCount: row.total_video_count,
    lastUploadAt: row.last_upload_at,
    uploads7d: row.uploads_7d,
    uploads30d: row.uploads_30d,
    avgUploadIntervalDays: row.avg_upload_interval_days,
    activityStatus: row.activity_status,
    updatedAt: row.updated_at,
  }));
}

// 최근 N일 이내 영상만 가져옵니다 (기본 30일 - 대시보드에서 쓰는 대부분의 계산에 충분한 범위)
export async function getRecentVideos(withinDays = 30): Promise<Video[]> {
  const supabase = getSupabaseClient();
  const since = new Date(Date.now() - withinDays * 86400000).toISOString();

  const { data, error } = await supabase
  .from("videos")
  .select("*")
  .neq("category", "증권")
  .gte("published_at", since)
  .order("published_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapVideoRow);
}

function mapVideoRow(row: any): Video {
  return {
    id: row.id,
    youtubeVideoId: row.youtube_video_id,
    channelId: row.channel_id,
    companyName: row.company_name,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
    durationSeconds: row.duration_seconds,
    isShorts: row.is_shorts,
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    videoUrl: row.video_url,
    aiSummary: row.ai_summary,
    aiKeywords: row.ai_keywords,
    aiContentTypes: row.ai_content_types,
    aiPlanningNotes: row.ai_planning_notes,
    aiImplication: row.ai_implication,
    aiAnalyzedAt: row.ai_analyzed_at,
    createdAt: row.created_at,
  };
}

export async function getLatestMarketInsight(): Promise<MarketInsight | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("market_insights")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    generatedAt: data.generated_at,
    periodLabel: data.period_label,
    trendSummary: data.trend_summary,
    mostActiveCompany: data.most_active_company,
    mostActiveCompanyStrength: data.most_active_company_strength,
    commonStrategy: data.common_strategy,
    strategyDifferences: data.strategy_differences,
    risingTopics: data.rising_topics ?? [],
    recommendationForKyobo: data.recommendation_for_kyobo,
    cautionTrend: data.caution_trend,
  };
}
