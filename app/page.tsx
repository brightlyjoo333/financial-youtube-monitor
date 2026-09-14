import {
  getAllChannels,
  getLatestMarketInsight,
  getRecentVideos,
} from "@/lib/data";

import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [channels, videos, insight] = await Promise.all([
    getAllChannels(),
    getRecentVideos(30),
    getLatestMarketInsight(),
  ]);

  return (
    <Dashboard
      channels={channels}
      videos={videos}
      insight={insight}
    />
  );
}