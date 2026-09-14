import type { DashboardKpis } from "@/types";

type ChannelLike = {
  companyName: string;
  uploads7d?: number | null;
  updatedAt?: string | null;
};

type VideoLike = {
  title: string;
  companyName: string;
  publishedAt: string;

  viewCount: number;
  likeCount: number;
  commentCount: number;

  videoUrl: string;
};

// ------------------------------------------------------------
// 날짜 유틸
// ------------------------------------------------------------

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isWithin(
  value: string,
  start: Date,
  end: Date
): boolean {
  const time = new Date(value).getTime();

  return (
    time >= start.getTime() &&
    time < end.getTime()
  );
}

export function percentChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

// ------------------------------------------------------------
// Dashboard KPI 계산
// ------------------------------------------------------------

export function calculateDashboardKpis(
  videos: VideoLike[],
  channels: ChannelLike[]
): DashboardKpis {
  const now = new Date();

  // 오늘
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  // 어제
  const yesterdayStart = addDays(todayStart, -1);

  // 최근 7일
  const last7Start = addDays(todayStart, -6);

  // 이전 7일
  const previous7Start = addDays(last7Start, -7);

  // ----------------------------------------------------------
  // 기간별 영상
  // ----------------------------------------------------------

  const todaysVideos = videos.filter((video) =>
    isWithin(
      video.publishedAt,
      todayStart,
      tomorrowStart
    )
  );

  const yesterdaysVideos = videos.filter((video) =>
    isWithin(
      video.publishedAt,
      yesterdayStart,
      todayStart
    )
  );

  const last7Videos = videos.filter((video) =>
    isWithin(
      video.publishedAt,
      last7Start,
      tomorrowStart
    )
  );

  const prev7Videos = videos.filter((video) =>
    isWithin(
      video.publishedAt,
      previous7Start,
      last7Start
    )
  );

  // ----------------------------------------------------------
  // 오늘 활동 채널
  // ----------------------------------------------------------

  const activeChannelNamesToday = Array.from(
    new Set(
      todaysVideos.map(
        (video) => video.companyName
      )
    )
  );

  const activeChannelsToday =
    activeChannelNamesToday.length;

  // ----------------------------------------------------------
  // 오늘 회사별 업로드 수
  // ----------------------------------------------------------

  const todayCountMap = new Map<string, number>();

  for (const video of todaysVideos) {
    todayCountMap.set(
      video.companyName,
      (todayCountMap.get(video.companyName) ?? 0) + 1
    );
  }

  const todayChannelBreakdown = Array.from(
    todayCountMap.entries()
  )
    .map(([companyName, count]) => ({
      companyName,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ----------------------------------------------------------
  // 최근 7일 회사별 업로드 수
  // ----------------------------------------------------------

  const last7CountMap = new Map<string, number>();

  for (const video of last7Videos) {
    last7CountMap.set(
      video.companyName,
      (last7CountMap.get(video.companyName) ?? 0) + 1
    );
  }

  const last7dChannelBreakdown = Array.from(
    last7CountMap.entries()
  )
    .map(([companyName, count]) => ({
      companyName,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ----------------------------------------------------------
  // 최근 7일 증감률
  // ----------------------------------------------------------

  const weekOverWeekChangePercent =
    percentChange(
      last7Videos.length,
      prev7Videos.length
    );

  // ----------------------------------------------------------
  // 가장 활발한 채널
  // channels 테이블 uploads7d 기준
  // ----------------------------------------------------------

  const mostActive = [...channels]
    .sort(
      (a, b) =>
        (b.uploads7d ?? 0) -
        (a.uploads7d ?? 0)
    )[0];

  // ----------------------------------------------------------
  // 최근 7일 최고 조회수 콘텐츠
  // ----------------------------------------------------------

  const topViewed = [...last7Videos]
    .sort(
      (a, b) =>
        b.viewCount - a.viewCount
    )[0];

  // ----------------------------------------------------------
  // Engagement TOP
  //
  // (좋아요 + 댓글) / 조회수 × 100
  // ----------------------------------------------------------

  const engagementTop = [...last7Videos]
    .map((video) => ({
      video,
      engagementRate:
        video.viewCount > 0
          ? ((video.likeCount +
              video.commentCount) /
              video.viewCount) *
            100
          : 0,
    }))
    .sort(
      (a, b) =>
        b.engagementRate -
        a.engagementRate
    )[0];

  // ----------------------------------------------------------
  // Rising Content
  //
  // 업로드 이후 시간당 조회수 기준
  // ----------------------------------------------------------

  const risingContent = [...last7Videos]
    .map((video) => {
      const publishedAt =
        new Date(
          video.publishedAt
        ).getTime();

      const nowMs = now.getTime();

      const hoursSincePublished =
        Math.max(
          (nowMs - publishedAt) /
            (1000 * 60 * 60),
          1
        );

      return {
        video,
        viewsPerHour:
          video.viewCount /
          hoursSincePublished,
      };
    })
    .sort(
      (a, b) =>
        b.viewsPerHour -
        a.viewsPerHour
    )[0];

  // ----------------------------------------------------------
  // 최종 KPI
  // ----------------------------------------------------------

  return {
    newVideosToday:
      todaysVideos.length,

    newVideosTodayDelta:
      todaysVideos.length -
      yesterdaysVideos.length,

    activeChannelsToday,

    totalChannelCount:
      channels.length,

    newVideos7d:
      last7Videos.length,

    weekOverWeekChangePercent,

    todayChannelBreakdown,

    activeChannelNamesToday,

    last7dChannelBreakdown,

    previous7dVideoCount:
      prev7Videos.length,

    mostActiveChannel: mostActive
      ? {
          companyName:
            mostActive.companyName,
          uploads7d:
            mostActive.uploads7d ?? 0,
        }
      : null,

    engagementTop: engagementTop
      ? {
          title:
            engagementTop.video.title,
          companyName:
            engagementTop.video.companyName,
          engagementRate:
            engagementTop.engagementRate,
          likeCount:
            engagementTop.video.likeCount,
          commentCount:
            engagementTop.video.commentCount,
          videoUrl:
            engagementTop.video.videoUrl,
        }
      : null,

    topViewedVideo: topViewed
      ? {
          title: topViewed.title,
          companyName:
            topViewed.companyName,
          viewCount:
            topViewed.viewCount,
          videoUrl:
            topViewed.videoUrl,
          publishedAt:
            topViewed.publishedAt,
        }
      : null,

    risingContent: risingContent
      ? {
          title:
            risingContent.video.title,
          companyName:
            risingContent.video.companyName,
          viewCount:
            risingContent.video.viewCount,
          videoUrl:
            risingContent.video.videoUrl,
          publishedAt:
            risingContent.video.publishedAt,
        }
      : null,

    lastSyncedAt:
      channels.length > 0
        ? channels
            .map(
              (channel) =>
                channel.updatedAt
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
            .sort()
            .reverse()[0] ?? null
        : null,
  };
}

export function calculatePeriodComparisons(
  videos: any[]
) {
  return [];
}

export function calculateTrendingKeywords(
  videos: any[]
) {
  return [];
}