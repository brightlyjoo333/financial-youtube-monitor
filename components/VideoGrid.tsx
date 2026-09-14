import type { Video } from "@/types";
import VideoCard from "@/components/VideoCard";

interface Props {
  videos: Video[];
}

export default function VideoGrid({ videos }: Props) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-400">
        조건에 맞는 콘텐츠가 없습니다. 필터를 조정해보세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
