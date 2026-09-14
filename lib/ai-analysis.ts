import type { ContentType, MarketInsight } from "@/types";

// ============================================================
// AI 분석을 담당하는 모듈입니다.
//
// 핵심 설계 원칙: 이 파일 "안에서만" Claude API / OpenAI API 를
// 직접 호출합니다. 다른 코드(components, app/*)는 절대 API를
// 직접 부르지 않고, 아래 두 함수만 사용합니다:
//
//   - analyzeVideo()          : 영상 1개 분석 (요약/키워드/유형 등)
//   - generateMarketInsight() : 전체 트렌드 분석 (AI Market Insight)
//
// 나중에 Claude ↔ OpenAI 를 바꾸고 싶으면, .env.local 의
// AI_PROVIDER 값만 "claude" 또는 "openai" 로 바꾸면 됩니다.
// ============================================================

export interface VideoAnalysisInput {
  title: string;
  description: string;
  companyName: string;
  category: string;
}

export interface VideoAnalysisResult {
  summary: string; // 3줄 요약
  keywords: string[]; // 3~5개
  contentTypes: ContentType[];
  planningNotes: string; // 콘텐츠 기획 특징
  implication: string; // 시사점
}

const CONTENT_TYPES: ContentType[] = [
  "광고", "브랜드 캠페인", "상품 홍보", "예능", "인터뷰", "정보",
  "금융교육", "Shorts", "이벤트", "CSR", "스포츠", "라이프스타일",
  "브랜디드 콘텐츠", "기타",
];

function getProvider(): "claude" | "openai" {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  return provider === "openai" ? "openai" : "claude";
}

// ---------- 영상 1개 분석 ----------
export async function analyzeVideo(
  input: VideoAnalysisInput
): Promise<VideoAnalysisResult> {
  const prompt = buildVideoAnalysisPrompt(input);
  const rawText = await callAi(prompt, 800);
  return parseVideoAnalysisResponse(rawText);
}

function buildVideoAnalysisPrompt(input: VideoAnalysisInput): string {
  return `당신은 금융회사 마케팅팀의 콘텐츠 애널리스트입니다.
아래 유튜브 영상 정보를 분석해서 JSON으로만 답하세요. 다른 설명 문장은 절대 붙이지 마세요.

[회사] ${input.companyName} (${input.category})
[제목] ${input.title}
[설명] ${input.description.slice(0, 1500)}

다음 JSON 형식으로만 응답하세요:
{
  "summary": "3줄 이내의 콘텐츠 요약",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "contentTypes": ["다음 중 1개 이상: ${CONTENT_TYPES.join(", ")}"],
  "planningNotes": "이 콘텐츠의 기획 특징 (1~2문장)",
  "implication": "이 콘텐츠가 시사하는 점, 경쟁사 관점에서 (1~2문장)"
}`;
}

function parseVideoAnalysisResponse(rawText: string): VideoAnalysisResult {
  const json = extractJson(rawText);
  return {
    summary: json.summary ?? "",
    keywords: Array.isArray(json.keywords) ? json.keywords.slice(0, 5) : [],
    contentTypes: Array.isArray(json.contentTypes)
      ? json.contentTypes.filter((t: string) =>
          CONTENT_TYPES.includes(t as ContentType)
        )
      : ["기타"],
    planningNotes: json.planningNotes ?? "",
    implication: json.implication ?? "",
  };
}

// ---------- 전체 트렌드 분석 (AI Market Insight) ----------
export interface MarketInsightInput {
  periodLabel: string;
  // 최근 기간 동안 업로드된 영상들의 요약 정보 (너무 많으면 토큰이 커지므로 상위 N개만 전달)
  recentVideos: {
    companyName: string;
    title: string;
    contentTypes?: ContentType[] | null;
  }[];
  channelUploadCounts: { companyName: string; uploads7d: number }[];
}

export async function generateMarketInsight(
  input: MarketInsightInput
): Promise<MarketInsight> {
  const prompt = buildMarketInsightPrompt(input);
  const rawText = await callAi(prompt, 1200);
  const json = extractJson(rawText);

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: input.periodLabel,
    trendSummary: json.trendSummary ?? "",
    mostActiveCompany: json.mostActiveCompany ?? "",
    mostActiveCompanyStrength: json.mostActiveCompanyStrength ?? "",
    commonStrategy: json.commonStrategy ?? "",
    strategyDifferences: json.strategyDifferences ?? "",
    risingTopics: Array.isArray(json.risingTopics) ? json.risingTopics : [],
    recommendationForKyobo: json.recommendationForKyobo ?? "",
    cautionTrend: json.cautionTrend ?? "",
  };
}

function buildMarketInsightPrompt(input: MarketInsightInput): string {
  const videoLines = input.recentVideos
    .slice(0, 60)
    .map(
      (v) =>
        `- [${v.companyName}] ${v.title}${
          v.contentTypes?.length ? ` (${v.contentTypes.join("/")})` : ""
        }`
    )
    .join("\n");

  const uploadLines = input.channelUploadCounts
    .sort((a, b) => b.uploads7d - a.uploads7d)
    .slice(0, 10)
    .map((c) => `- ${c.companyName}: 최근 7일 ${c.uploads7d}개`)
    .join("\n");

  return `당신은 교보생명 디지털마케팅팀의 콘텐츠 전략 애널리스트입니다.
아래는 ${input.periodLabel} 동안 경쟁 금융사들의 유튜브 업로드 데이터입니다.
데이터를 단순 요약하지 말고, "그래서 콘텐츠 전략 측면에서 무엇을 의미하는지" 실무자가
바로 참고할 수 있는 수준으로 분석해서 JSON으로만 답하세요.

[최근 업로드된 영상 목록]
${videoLines}

[채널별 최근 7일 업로드 수]
${uploadLines}

다음 JSON 형식으로만 응답하세요:
{
  "trendSummary": "최근 콘텐츠 트렌드 (2~3문장)",
  "mostActiveCompany": "가장 활발한 금융사명",
  "mostActiveCompanyStrength": "그 회사가 잘하고 있는 점 (1~2문장)",
  "commonStrategy": "경쟁사들의 공통적인 콘텐츠 전략 (1~2문장)",
  "strategyDifferences": "경쟁사 간 전략 차이 (1~2문장)",
  "risingTopics": ["최근 증가하는 주제1", "주제2", "주제3"],
  "recommendationForKyobo": "교보생명이 참고할 만한 콘텐츠 기획 Insight (2~3문장)",
  "cautionTrend": "주의해야 할 콘텐츠 트렌드 (1~2문장)"
}`;
}

// ============================================================
// 실제 API 호출부. 여기만 Provider 별로 분기됩니다.
// ============================================================
async function callAi(prompt: string, maxTokens: number): Promise<string> {
  const provider = getProvider();
  return provider === "openai"
    ? callOpenAi(prompt, maxTokens)
    : callClaude(prompt, maxTokens);
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 가 설정되지 않았습니다.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API 호출 실패: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  return textBlock?.text ?? "";
}

async function callOpenAi(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 가 설정되지 않았습니다.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API 호출 실패: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// AI 응답에 ```json 코드블록이 섞여 와도 안전하게 JSON을 뽑아내는 헬퍼
function extractJson(rawText: string): any {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // JSON 파싱 실패 시 서비스가 죽지 않도록 빈 객체 반환
    console.error("AI 응답 JSON 파싱 실패:", rawText);
    return {};
  }
}
