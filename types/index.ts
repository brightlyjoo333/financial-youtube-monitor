// ============================================================
// 이 파일은 서비스 전체에서 쓰는 데이터 모양(타입)을 정의합니다.
// 새로운 필드를 추가하고 싶으면 여기에 먼저 추가한 뒤,
// supabase/schema.sql 의 테이블 컬럼도 같이 추가해주세요.
// ============================================================

export type Category =
  | "생명보험"
  | "손해보험"
  | "금융그룹"
  | "은행"
  | "증권";

// config/channels.ts 에서 관리하는 "모니터링 대상 채널" 정의
export interface ChannelConfig {
  companyName: string; // 예: "삼성생명"
  channelName: string; // 예: "삼성생명 공식 유튜브"
  category: Category;
  youtubeChannelId: string; // 예: "UCxxxxxxxxxxxxxxxx"
}

// Supabase `channels` 테이블 = ChannelConfig + YouTube에서 수집한 최신 통계
export interface Channel extends ChannelConfig {
  id: string; // Supabase 내부 UUID
  thumbnailUrl: string | null;
  subscriberCount: number;
  totalVideoCount: number;
  lastUploadAt: string | null; // ISO date string
  uploads7d: number;
  uploads30d: number;
  avgUploadIntervalDays: number | null;
  activityStatus: ActivityStatus;
  updatedAt: string;
}

export type ActivityStatus = "Very Active" | "Active" | "Normal" | "Inactive";

// 콘텐츠 유형 (AI가 영상당 1개 이상 태깅)
export type ContentType =
  | "광고"
  | "브랜드 캠페인"
  | "상품 홍보"
  | "예능"
  | "인터뷰"
  | "정보"
  | "금융교육"
  | "Shorts"
  | "이벤트"
  | "CSR"
  | "스포츠"
  | "라이프스타일"
  | "브랜디드 콘텐츠"
  | "기타";

// Supabase `videos` 테이블
export interface Video {
  id: string; // Supabase 내부 UUID
  youtubeVideoId: string;
  channelId: string; // channels.id 참조
  companyName: string; // 조인 없이 빠르게 필터링하기 위해 중복 저장
  category: Category;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string; // ISO date string
  durationSeconds: number;
  isShorts: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  videoUrl: string;

  // --- 아래는 AI 분석 결과 (lib/ai-analysis.ts 가 채움) ---
  aiSummary: string | null; // 3줄 요약
  aiKeywords: string[] | null; // 키워드 3~5개
  aiContentTypes: ContentType[] | null;
  aiPlanningNotes: string | null; // 콘텐츠 기획 특징
  aiImplication: string | null; // 이 콘텐츠가 시사하는 점
  aiAnalyzedAt: string | null;

  createdAt: string;
}

// 오늘 vs 어제, 이번주 vs 지난주 등 기간 비교용
export interface PeriodComparison {
  label: string; // "오늘 vs 어제" 등
  current: PeriodMetrics;
  previous: PeriodMetrics;
}

export interface PeriodMetrics {
  uploadCount: number;
  activeChannelCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

// Dashboard 상단 KPI 카드용
export interface DashboardKpis {
  newVideosToday: number;
  newVideosTodayDelta: number;

  activeChannelsToday: number;
  totalChannelCount: number;

  newVideos7d: number;
  weekOverWeekChangePercent: number;

  todayChannelBreakdown: {
    companyName: string;
    count: number;
  }[];

  activeChannelNamesToday: string[];

  last7dChannelBreakdown: {
    companyName: string;
    count: number;
  }[];

  previous7dVideoCount: number;

  mostActiveChannel: {
    companyName: string;
    uploads7d: number;
  } | null;

topViewedVideo:
  | Pick<
      Video,
      "title" | "companyName" | "viewCount" | "videoUrl" | "publishedAt"
    >
  | null;

risingContent:
  | Pick<
      Video,
      "title" | "companyName" | "viewCount" | "videoUrl" | "publishedAt"
    >
  | null;

lastSyncedAt: string | null;

}

// "AI Market Insight" 영역 - 개별 영상이 아니라 전체 트렌드에 대한 AI 코멘트
export interface MarketInsight {
  generatedAt: string;
  periodLabel: string; // 예: "최근 7일"
  trendSummary: string; // 1. 최근 콘텐츠 트렌드
  mostActiveCompany: string; // 2. 가장 활발한 금융사
  mostActiveCompanyStrength: string; // 3. 그 회사가 잘하고 있는 점
  commonStrategy: string; // 4. 공통적인 콘텐츠 전략
  strategyDifferences: string; // 5. 전략 차이
  risingTopics: string[]; // 6. 증가하고 있는 콘텐츠 주제
  recommendationForKyobo: string; // 7. 교보생명 참고 Insight
  cautionTrend: string; // 8. 주의해야 할 트렌드
}

export interface TrendingKeyword {
  keyword: string;
  count: number; // 최근 기간 동안 등장한 영상 수
}

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

export interface VideoFilters {
  category: "전체" | Category;
  dateRange: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  contentType: "전체" | ContentType;
  sortBy: "latest" | "views" | "likes" | "comments";
  searchQuery: string;
}
