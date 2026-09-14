import type { DashboardKpis } from "@/types";

interface Props {
  kpis: DashboardKpis;
}

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "방금 전";
  if (diffHours < 1) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR");
}

function DeltaBadge({
  value,
  isPercent = false,
}: {
  value: number;
  isPercent?: boolean;
}) {
  const isUp = value > 0;
  const isFlat = value === 0;

  const color = isFlat
    ? "text-gray-400"
    : isUp
    ? "text-brand-600"
    : "text-red-500";

  const arrow = isFlat ? "" : isUp ? "▲" : "▼";

  const formatted = isPercent
    ? `${Math.abs(value).toFixed(1)}%`
    : Math.abs(value);

  return (
    <span className={`text-sm font-medium ${color}`}>
      {arrow} {isUp && !isFlat ? "+" : isFlat ? "" : "-"}
      {formatted}
    </span>
  );
}

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>

      <div className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </div>

      {sub && <div className="mt-3">{sub}</div>}
    </div>
  );
}

function ChannelBreakdown({
  items,
  limit = 3,
}: {
  items: { companyName: string; count: number }[];
  limit?: number;
}) {
  const visible = items.slice(0, limit);
  const remaining = items.length - visible.length;

  if (!items.length) {
    return <div className="text-xs text-gray-400">업로드 없음</div>;
  }

  return (
    <div className="space-y-1">
      {visible.map((item) => (
        <div
          key={item.companyName}
          className="flex items-center justify-between text-xs"
        >
          <span className="truncate text-gray-600">
            {item.companyName}
          </span>

          <span className="ml-2 font-medium text-gray-900">
            {item.count}개
          </span>
        </div>
      ))}

      {remaining > 0 && (
        <div className="text-xs text-gray-400">
          외 {remaining}개 채널
        </div>
      )}
    </div>
  );
}

export default function KpiCards({ kpis }: Props) {
  const topViewedTimeAgo = kpis.topViewedVideo
    ? formatTimeAgo(kpis.topViewedVideo.publishedAt)
    : "";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="오늘 신규 영상"
        value={kpis.newVideosToday}
        sub={
          <>
            <ChannelBreakdown
              items={kpis.todayChannelBreakdown}
            />

            <div className="mt-2 border-t border-gray-100 pt-2">
              <span className="mr-2 text-xs text-gray-400">
                어제 대비
              </span>

              <DeltaBadge
                value={kpis.newVideosTodayDelta}
              />
            </div>
          </>
        }
      />

      <Card
        label="오늘 활동 채널"
        value={`${kpis.activeChannelsToday} / ${kpis.totalChannelCount}`}
        sub={
          <div className="space-y-1">
            {kpis.activeChannelNamesToday.length ? (
              <>
                {kpis.activeChannelNamesToday
                  .slice(0, 3)
                  .map((name) => (
                    <div
                      key={name}
                      className="truncate text-xs text-gray-600"
                    >
                      {name}
                    </div>
                  ))}

                {kpis.activeChannelNamesToday.length > 3 && (
                  <div className="text-xs text-gray-400">
                    외 {kpis.activeChannelNamesToday.length - 3}개 채널
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400">
                오늘 활동 채널 없음
              </div>
            )}
          </div>
        }
      />

      <Card
        label="최근 7일 신규 영상"
        value={kpis.newVideos7d}
        sub={
          <ChannelBreakdown
            items={kpis.last7dChannelBreakdown}
            limit={5}
          />
        }
      />

      <Card
        label="최근 7일 업로드 증감"
        value={
          <DeltaBadge
            value={kpis.weekOverWeekChangePercent}
            isPercent
          />
        }
        sub={
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>최근 7일</span>
              <strong className="text-gray-800">
                {kpis.newVideos7d}개
              </strong>
            </div>

            <div className="flex justify-between">
              <span>이전 7일</span>
              <strong className="text-gray-800">
                {kpis.previous7dVideoCount}개
              </strong>
            </div>
          </div>
        }
      />

      

      <Card
        label="가장 활발한 채널"
        value={kpis.mostActiveChannel?.companyName ?? "-"}
        sub={
          kpis.mostActiveChannel ? (
            <span className="text-xs text-gray-400">
              최근 7일 {kpis.mostActiveChannel.uploads7d}개 업로드
            </span>
          ) : undefined
        }
      />

      <Card
  label="Engagement TOP"
  value={
    kpis.engagementTop ? (
      <a
        href={kpis.engagementTop.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-1 text-base font-medium text-brand-700 hover:underline"
        title={kpis.engagementTop.title}
      >
        {kpis.engagementTop.title}
      </a>
    ) : (
      "-"
    )
  }
  sub={
    kpis.engagementTop ? (
      <div className="space-y-1 text-xs text-gray-400">
        <div>{kpis.engagementTop.companyName}</div>

        <div>
          좋아요 {kpis.engagementTop.likeCount.toLocaleString()}
          {" · "}
          댓글 {kpis.engagementTop.commentCount.toLocaleString()}
        </div>

        <div className="font-medium text-brand-700">
          참여 반응{" "}
          {(
            kpis.engagementTop.likeCount +
            kpis.engagementTop.commentCount
          ).toLocaleString()}
        </div>
      </div>
    ) : undefined
  }
/>

      <Card
        label="최고 조회수 신규 콘텐츠"
        value={
          kpis.topViewedVideo ? (
            <a
              href={kpis.topViewedVideo.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 text-base font-medium text-brand-700 hover:underline"
              title={kpis.topViewedVideo.title}
            >
              {kpis.topViewedVideo.title}
            </a>
          ) : (
            "-"
          )
        }
        sub={
          kpis.topViewedVideo ? (
            <div className="space-y-1 text-xs text-gray-400">
              <div>
                {kpis.topViewedVideo.companyName}
              </div>

              <div>
                조회수{" "}
                {kpis.topViewedVideo.viewCount.toLocaleString()}
                {topViewedTimeAgo ? ` · ${topViewedTimeAgo}` : ""}
              </div>
            </div>
          ) : undefined
        }
      />

      <Card
  label="Rising Content"
  value={
    kpis.risingContent ? (
      <a
        href={kpis.risingContent.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-1 text-base font-medium text-brand-700 hover:underline"
        title={kpis.risingContent.title}
      >
        {kpis.risingContent.title}
      </a>
    ) : (
      "-"
    )
  }
 sub={
  kpis.risingContent ? (
    <div className="space-y-1 text-xs text-gray-400">
      <div>{kpis.risingContent.companyName}</div>

      <div>
        조회수 {kpis.risingContent.viewCount.toLocaleString()}
        {formatTimeAgo(kpis.risingContent.publishedAt)
          ? ` · ${formatTimeAgo(kpis.risingContent.publishedAt)}`
          : ""}
      </div>

      <div className="font-medium text-brand-700">
  시간당 조회수{" "}
  {Math.round(
    kpis.risingContent.viewCount /
      Math.max(
        Math.floor(
          (Date.now() -
            new Date(kpis.risingContent.publishedAt).getTime()) /
            (1000 * 60 * 60)
        ),
        1
      )
  ).toLocaleString()}
</div>
    </div>
  ) : undefined
}
/>
    </div>
  );
}