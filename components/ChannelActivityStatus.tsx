import type { ActivityStatus, Channel } from "@/types";

interface Props {
  channels: Channel[];
}

const STATUS_ORDER: { status: ActivityStatus; color: string; description: string }[] = [
  { status: "Very Active", color: "bg-brand-600", description: "최근 7일 5개 이상 업로드" },
  { status: "Active", color: "bg-brand-500", description: "최근 7일 2~4개 업로드" },
  { status: "Normal", color: "bg-yellow-400", description: "최근 7일 1개 업로드" },
  { status: "Inactive", color: "bg-gray-300", description: "최근 30일 신규 업로드 없음" },
];

export default function ChannelActivityStatus({ channels }: Props) {
  const counts = STATUS_ORDER.map(({ status }) => ({
    status,
    count: channels.filter((c) => c.activityStatus === status).length,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">Channel Activity Status</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATUS_ORDER.map(({ status, color, description }) => {
          const count = counts.find((c) => c.status === status)?.count ?? 0;
          return (
            <div key={status} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-sm font-medium text-gray-700">{status}</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{count}</div>
              <div className="mt-1 text-xs text-gray-400">{description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
