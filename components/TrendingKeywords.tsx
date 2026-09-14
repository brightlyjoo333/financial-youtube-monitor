import type { TrendingKeyword } from "@/types";

interface Props {
  keywords: TrendingKeyword[];
}

export default function TrendingKeywords({ keywords }: Props) {
  if (keywords.length === 0) return null;

  const maxCount = Math.max(...keywords.map((k) => k.count));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">Trending Topics / Keywords</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => {
          // 등장 빈도가 높을수록 살짝 더 진하게 표시
          const intensity = k.count / maxCount;
          const bg = intensity > 0.66 ? "bg-brand-600 text-white" : intensity > 0.33 ? "bg-brand-100 text-brand-800" : "bg-gray-100 text-gray-600";
          return (
            <span key={k.keyword} className={`rounded-full px-3 py-1.5 text-sm font-medium ${bg}`}>
              {k.keyword} <span className="opacity-70">· {k.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
