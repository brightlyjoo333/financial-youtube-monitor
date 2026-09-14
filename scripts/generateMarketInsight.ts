import { getSupabaseAdminClient } from "../lib/supabase";
import { generateMarketInsight } from "../lib/ai-analysis";

const supabase = getSupabaseAdminClient();

async function main() {
  console.log("AI Market Insight 생성을 시작합니다...");

  const { data: recentVideos, error: videoError } = await supabase
    .from("videos")
    .select("company_name, title, ai_content_types, published_at, category")
    .neq("category", "증권")
    .not("ai_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  if (videoError) {
    throw videoError;
  }

  const { data: allChannels, error: channelError } = await supabase
    .from("channels")
    .select("company_name, uploads_7d, category")
    .neq("category", "증권");

  if (channelError) {
    throw channelError;
  }

  console.log(
    `분석 대상: 영상 ${recentVideos?.length ?? 0}개 / 채널 ${allChannels?.length ?? 0}개`
  );

  const insight = await generateMarketInsight({
    periodLabel: "최근 7일",
    recentVideos: (recentVideos ?? []).map((video) => ({
      companyName: video.company_name,
      title: video.title,
      contentTypes: video.ai_content_types ?? [],
    })),
    channelUploadCounts: (allChannels ?? []).map((channel) => ({
      companyName: channel.company_name,
      uploads7d: channel.uploads_7d ?? 0,
    })),
  });

  const { error: upsertError } = await supabase
    .from("market_insights")
    .upsert({
      id: 1,
      generated_at: insight.generatedAt,
      period_label: insight.periodLabel,
      trend_summary: insight.trendSummary,
      most_active_company: insight.mostActiveCompany,
      most_active_company_strength: insight.mostActiveCompanyStrength,
      common_strategy: insight.commonStrategy,
      strategy_differences: insight.strategyDifferences,
      rising_topics: insight.risingTopics,
      recommendation_for_kyobo: insight.recommendationForKyobo,
      caution_trend: insight.cautionTrend,
    });

  if (upsertError) {
    throw upsertError;
  }

  console.log("AI Market Insight 저장 완료");
  console.log("==============================");
  console.log("가장 활발한 금융사:", insight.mostActiveCompany);
  console.log("상승 주제:", insight.risingTopics.join(", "));
  console.log("==============================");
}

main().catch((err) => {
  console.error("Market Insight 생성 실패:", err);
  process.exit(1);
});
