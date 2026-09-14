import { getSupabaseAdminClient } from "../lib/supabase";
import { analyzeVideo } from "../lib/ai-analysis";

const supabase = getSupabaseAdminClient();

async function main() {
  console.log("회사별 최신 미분석 영상 1개씩 찾습니다...");

  // 증권사를 제외한 미분석 영상 조회
  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      "id, youtube_video_id, title, description, company_name, category, published_at, ai_summary"
    )
    .neq("category", "증권")
    .is("ai_summary", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!videos || videos.length === 0) {
    console.log("분석할 영상이 없습니다.");
    return;
  }

  // 회사별로 가장 최신 영상 1개만 선택
  const latestByCompany = new Map<string, (typeof videos)[number]>();

  for (const video of videos) {
    if (!latestByCompany.has(video.company_name)) {
      latestByCompany.set(video.company_name, video);
    }
  }

  const targets = Array.from(latestByCompany.values());

  console.log("분석 대상 회사:");
console.log(targets.map((video) => video.company_name));

  console.log(`총 ${targets.length}개 회사의 영상을 분석합니다.`);


  let successCount = 0;
  let failCount = 0;

  for (const video of targets) {
    try {
      console.log(`\n분석 중: [${video.company_name}] ${video.title}`);

      const analysis = await analyzeVideo({
        title: video.title,
        description: video.description ?? "",
        companyName: video.company_name,
        category: video.category,
      });

      const { error: updateError } = await supabase
        .from("videos")
        .update({
          ai_summary: analysis.summary,
          ai_keywords: analysis.keywords,
          ai_content_types: analysis.contentTypes,
          ai_planning_notes: analysis.planningNotes,
          ai_implication: analysis.implication,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq("id", video.id);

      if (updateError) {
        throw updateError;
      }

      successCount++;
      console.log("완료");
    } catch (err: any) {
      failCount++;
      console.error(`실패: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 7000));
}
  

  console.log("\n==============================");
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log("==============================");
}

main().catch((err) => {
  console.error("스크립트 실행 실패:", err);
  process.exit(1);
});