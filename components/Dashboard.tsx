"use client";

import { useMemo, useState } from "react";
import type { Channel, MarketInsight, Video, VideoFilters } from "@/types";
import {
  calculateDashboardKpis,
  calculatePeriodComparisons,
  calculateTrendingKeywords,
} from "@/lib/stats";

import Header from "@/components/Header";
import KpiCards from "@/components/KpiCards";
import ComparisonPanel from "@/components/ComparisonPanel";
import ChannelActivityStatus from "@/components/ChannelActivityStatus";
import AiMarketInsight from "@/components/AiMarketInsight";
import TrendingKeywords from "@/components/TrendingKeywords";
import Filters from "@/components/Filters";
import VideoGrid from "@/components/VideoGrid";
import ChannelPerformance from "@/components/ChannelPerformance";

interface Props {
  channels: Channel[];
  videos: Video[]; // 최근 30일 영상 (app/page.tsx 에서 미리 불러옴)
  insight: MarketInsight | null;
}

const DEFAULT_FILTERS: VideoFilters = {
  category: "전체",
  dateRange: "30d",
  contentType: "전체",
  sortBy: "latest",
  searchQuery: "",
};

function applyFilters(videos: Video[], filters: VideoFilters): Video[] {
  const now = Date.now();
  const rangeMs =
    filters.dateRange === "today"
      ? 86400000
      : filters.dateRange === "7d"
      ? 7 * 86400000
      : 30 * 86400000;

  let result = videos.filter((v) => now - new Date(v.publishedAt).getTime() <= rangeMs);

  if (filters.category !== "전체") {
    result = result.filter((v) => v.category === filters.category);
  }

  if (filters.contentType !== "전체") {
    result = result.filter((v) => v.aiContentTypes?.includes(filters.contentType as any));
  }

  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    result = result.filter((v) => {
      const haystack = [
        v.title,
        v.description,
        v.aiSummary ?? "",
        ...(v.aiKeywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const sorted = [...result];
  switch (filters.sortBy) {
    case "views":
      sorted.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case "likes":
      sorted.sort((a, b) => b.likeCount - a.likeCount);
      break;
    case "comments":
      sorted.sort((a, b) => b.commentCount - a.commentCount);
      break;
    default:
      sorted.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }
  return sorted;
}

export default function Dashboard({ channels, videos, insight }: Props) {
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);

  const kpis = useMemo(() => calculateDashboardKpis(videos, channels), [videos, channels]);
  const comparisons = useMemo(() => calculatePeriodComparisons(videos), [videos]);
  const trendingKeywords = useMemo(() => calculateTrendingKeywords(videos), [videos]);
  const filteredVideos = useMemo(() => applyFilters(videos, filters), [videos, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lastSyncedAt={kpis.lastSyncedAt} />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <KpiCards kpis={kpis} />

        <ComparisonPanel comparisons={comparisons} />

        <ChannelActivityStatus channels={channels} />

        <AiMarketInsight insight={insight} />

        <TrendingKeywords keywords={trendingKeywords} />

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Recent YouTube Contents</h2>
          <Filters filters={filters} onChange={setFilters} />
          <VideoGrid videos={filteredVideos} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Channel Performance</h2>
          <ChannelPerformance channels={channels} />
        </section>
      </main>
    </div>
  );
}
