import type { MarketInsight } from "@/types";

interface Props {
  insight: MarketInsight | null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 py-3 first:border-t-0">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
        {label}
      </div>
      <div className="text-sm leading-relaxed text-gray-800">{children}</div>
    </div>
  );
}

export default function AiMarketInsight({ insight }: Props) {
  if (!insight) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">AI Market Insight</h3>
        <p className="text-sm text-gray-400">
          아직 생성된 인사이트가 없습니다. 데이터 동기화(/api/sync)가 최소 1회 실행되면 이 영역이
          채워집니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AI Market Insight</h3>
        <span className="text-xs text-gray-400">{insight.periodLabel} 기준</span>
      </div>

      <Row label="최근 콘텐츠 트렌드">{insight.trendSummary}</Row>
      <Row label="가장 활발한 금융사">
        <strong>{insight.mostActiveCompany}</strong> — {insight.mostActiveCompanyStrength}
      </Row>
      <Row label="공통 콘텐츠 전략">{insight.commonStrategy}</Row>
      <Row label="경쟁사 간 전략 차이">{insight.strategyDifferences}</Row>
      <Row label="증가하는 콘텐츠 주제">
        <div className="flex flex-wrap gap-2">
          {insight.risingTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200"
            >
              {topic}
            </span>
          ))}
        </div>
      </Row>
      <Row label="교보생명 참고 Insight">{insight.recommendationForKyobo}</Row>
      <Row label="주의해야 할 트렌드">{insight.cautionTrend}</Row>
    </div>
  );
}
