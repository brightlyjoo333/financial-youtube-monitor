import type { Channel, DashboardKpis, PeriodComparison, PeriodMetrics, TrendingKeyword, Video } from "@/types";

// ============================================================
// Supabase에서 읽어온 videos/channels 배열을 가지고
// 대시보드에 필요한 숫자들을 계산하는 순수 함수 모음입니다.
// (DB나 API 호출이 전혀 없어서 테스트하기 쉽습니다)
// ============================================================

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isWithin(date: Date, from: Date, to: Date): boolean {
  return date >= from && date < to;
}

export function calculateDashboardKpis(
  videos: Video[],
  channels: Channel[],
  now: Date = new Date()
): DashboardKpis {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  const last7Start = new Date(todayStart.getTime() - 7 * 86400000);
  const prev7Start = new Date(todayStart.getTime() - 14 * 86400000);

  const todaysVideos = videos.filter((v) =>
    isWithin(new Date(v.publishedAt), todayStart, tomorrowStart)
  );

  const yesterdaysVideos = videos.filter((v) =>
    isWithin(new Date(v.publishedAt), yesterdayStart, todayStart)
  );

  const last7Videos = videos.filter((v) =>
    isWithin(new Date(v.publishedAt), last7Start, tomorrowStart)
  );

  const prev7Videos = videos.filter((v) =>
    isWithin(new Date(v.publishedAt), prev7Start, last7Start)
  );

  const makeChannelBreakdown = (targetVideos: Video[]) => {
    const counts = new Map<string, number>();

    targetVideos.forEach((video) => {
      counts.set(
        video.companyName,
        (counts.get(video.companyName) ?? 0) + 1
      );
    });

    return [...counts.entries()]
      .map(([companyName, count]) => ({
        companyName,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const todayChannelBreakdown = makeChannelBreakdown(todaysVideos);
  const last7dChannelBreakdown = makeChannelBreakdown(last7Videos);

  const activeChannelNamesToday = todayChannelBreakdown.map(
    (item) => item.companyName
  );

  const activeChannelsToday = activeChannelNamesToday.length;

  const weekOverWeekChangePercent = prev7Videos.length
    ? ((last7Videos.length - prev7Videos.length) / prev7Videos.length) * 100
    : last7Videos.length > 0
    ? 100
    : 0;

  const mostActive = [...channels].sort(
    (a, b) => b.uploads7d - a.uploads7d
  )[0];

  const topViewed = [...last7Videos].sort(
    (a, b) => b.viewCount - a.viewCount
  )[0];

  const risingContent = [...last7Videos]
  .map((video) => {
    const publishedAt = new Date(video.publishedAt).getTime();
    const nowMs = now.getTime();

    const hoursSincePublished = Math.max(
      (nowMs - publishedAt) / (1000 * 60 * 60),
      1
    );

    return {
      video,
      viewsPerHour: video.viewCount / hoursSincePublished,
    };
  })
  .sort((a, b) => b.viewsPerHour - a.viewsPerHour)[0];

  return {
    newVideosToday: todaysVideos.length,
    newVideosTodayDelta:
      todaysVideos.length - yesterdaysVideos.length,

    activeChannelsToday,
    totalChannelCount: channels.length,

    newVideos7d: last7Videos.length,
    weekOverWeekChangePercent,

    todayChannelBreakdown,
    activeChannelNamesToday,
    last7dChannelBreakdown,
    previous7dVideoCount: prev7Videos.length,

    mostActiveChannel: mostActive
      ? {
          companyName: mostActive.companyName,
          uploads7d: mostActive.uploads7d,
        }
      : null,

    topViewedVideo: topViewed
  ? {
      title: topViewed.title,
      companyName: topViewed.companyName,
      viewCount: topViewed.viewCount,
      videoUrl: topViewed.videoUrl,
      publishedAt: topViewed.publishedAt,
    }
  : null,

  risingContent: risingContent
  ? {
      title: risingContent.video.title,
      companyName: risingContent.video.companyName,
      viewCount: risingContent.video.viewCount,
      videoUrl: risingContent.video.videoUrl,
      publishedAt: risingContent.video.publishedAt,
    }
  : null,

    lastSyncedAt: channels.length
      ? channels
          .map((c) => c.updatedAt)
          .sort()
          .reverse()[0]
      : null,
  };
}

function metricsFor(videos: Video[]): PeriodMetrics {
  return {
    uploadCount: videos.length,
    activeChannelCount: new Set(videos.map((v) => v.companyName)).size,
    totalViews: videos.reduce((sum, v) => sum + v.viewCount, 0),
    totalLikes: videos.reduce((sum, v) => sum + v.likeCount, 0),
    totalComments: videos.reduce((sum, v) => sum + v.commentCount, 0),
  };
}

export function calculatePeriodComparisons(
  videos: Video[],
  now: Date = new Date()
): PeriodComparison[] {
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const last7Start = new Date(todayStart.getTime() - 7 * 86400000);
  const prev7Start = new Date(todayStart.getTime() - 14 * 86400000);

  // "이번 주"는 이번 주 일요일(또는 월요일) 부터로 정의할 수도 있지만,
  // 여기서는 단순하게 "최근 7일 vs 그 이전 7일"과 동일한 롤링 윈도우로 계산합니다.
  // 달력 기준 주 단위가 필요하면 이 부분만 수정하세요.
  const inRange = (v: Video, from: Date, to: Date) =>
    isWithin(new Date(v.publishedAt), from, to);

  return [
    {
      label: "오늘 vs 어제",
      current: metricsFor(videos.filter((v) => inRange(v, todayStart, tomorrowStart))),
      previous: metricsFor(videos.filter((v) => inRange(v, yesterdayStart, todayStart))),
    },
    {
      label: "최근 7일 vs 이전 7일",
      current: metricsFor(videos.filter((v) => inRange(v, last7Start, tomorrowStart))),
      previous: metricsFor(videos.filter((v) => inRange(v, prev7Start, last7Start))),
    },
  ];
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateTrendingKeywords(
  videos: Video[],
  limit = 15
): TrendingKeyword[] {
  const counts = new Map<string, number>();
  for (const v of videos) {
    for (const kw of v.aiKeywords ?? []) {
      counts.set(kw, (counts.get(kw) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
