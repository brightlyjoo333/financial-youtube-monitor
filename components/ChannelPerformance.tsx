import type { Channel } from "@/types";

interface Props {
  channels: Channel[];
}

const STATUS_STYLE: Record<Channel["activityStatus"], string> = {
  "Very Active": "bg-brand-600 text-white",
  Active: "bg-brand-100 text-brand-800",
  Normal: "bg-yellow-100 text-yellow-800",
  Inactive: "bg-gray-100 text-gray-500",
};

export default function ChannelPerformance({ channels }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
            <th className="px-4 py-3 font-medium">채널</th>
            <th className="px-4 py-3 font-medium">카테고리</th>
            <th className="px-4 py-3 font-medium text-right">구독자</th>
            <th className="px-4 py-3 font-medium text-right">최근 7일</th>
            <th className="px-4 py-3 font-medium text-right">최근 30일</th>
            <th className="px-4 py-3 font-medium">최근 업로드</th>
            <th className="px-4 py-3 font-medium">활성도</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.companyName}</td>
              <td className="px-4 py-3 text-gray-500">{c.category}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {c.subscriberCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{c.uploads7d}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.uploads30d}</td>
              <td className="px-4 py-3 text-gray-500">
                {c.lastUploadAt ? new Date(c.lastUploadAt).toLocaleDateString("ko-KR") : "-"}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[c.activityStatus]}`}>
                  {c.activityStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
