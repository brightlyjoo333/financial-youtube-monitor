"use client";

import type { Category, ContentType, VideoFilters } from "@/types";

interface Props {
  filters: VideoFilters;
  onChange: (next: VideoFilters) => void;
}

const CATEGORIES: ("전체" | Category)[] = ["전체", "생명보험", "손해보험", "금융그룹", "은행", "증권"];
const CONTENT_TYPES: ("전체" | ContentType)[] = [
  "전체", "광고", "브랜드 캠페인", "예능", "정보", "상품 홍보", "인터뷰", "Shorts",
];

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-500">
      {label}
      <select
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Filters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap gap-4">
        <Select
          label="금융사 카테고리"
          value={filters.category}
          options={CATEGORIES}
          onChange={(v) => onChange({ ...filters, category: v as VideoFilters["category"] })}
        />
        <Select
          label="기간"
          value={filters.dateRange}
          options={["today", "7d", "30d"]}
          onChange={(v) => onChange({ ...filters, dateRange: v as VideoFilters["dateRange"] })}
        />
        <Select
          label="콘텐츠 유형"
          value={filters.contentType}
          options={CONTENT_TYPES}
          onChange={(v) => onChange({ ...filters, contentType: v as VideoFilters["contentType"] })}
        />
        <Select
          label="정렬"
          value={filters.sortBy}
          options={["latest", "views", "likes", "comments"]}
          onChange={(v) => onChange({ ...filters, sortBy: v as VideoFilters["sortBy"] })}
        />
      </div>

      <label className="flex flex-col gap-1 text-xs text-gray-500 md:w-72">
        검색 (제목 · 설명 · AI 요약 · 키워드)
        <input
          type="text"
          placeholder="예: 연금, AI, 건강, 부동산, 마라톤"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
        />
      </label>
    </div>
  );
}
