import type { PeriodComparison } from "@/types";
import { percentChange } from "@/lib/stats";

interface Props {
  comparisons: PeriodComparison[];
}

const METRIC_LABELS: { key: keyof PeriodComparison["current"]; label: string }[] = [
  { key: "uploadCount", label: "영상 업로드 수" },
  { key: "activeChannelCount", label: "활동 채널 수" },
  { key: "totalViews", label: "조회수" },
  { key: "totalLikes", label: "좋아요" },
  { key: "totalComments", label: "댓글 수" },
];

function ChangeTag({ value }: { value: number }) {
  const isUp = value > 0;
  const isFlat = Math.round(value * 10) === 0;
  const color = isFlat ? "text-gray-400" : isUp ? "text-brand-600" : "text-red-500";
  const arrow = isFlat ? "-" : isUp ? "▲" : "▼";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {isFlat ? "0.0" : `${isUp ? "+" : ""}${value.toFixed(1)}`}%
    </span>
  );
}

export default function ComparisonPanel({ comparisons }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {comparisons.map((comp) => (
        <div key={comp.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{comp.label}</h3>
          <table className="w-full text-sm">
            <tbody>
              {METRIC_LABELS.map(({ key, label }) => (
                <tr key={key} className="border-t border-gray-100 first:border-t-0">
                  <td className="py-2 text-gray-500">{label}</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {comp.current[key].toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <ChangeTag value={percentChange(comp.current[key], comp.previous[key])} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
