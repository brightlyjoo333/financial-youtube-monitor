import Image from "next/image";
import type { Video } from "@/types";

interface Props {
  video: Video;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function VideoCard({ video }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="relative block aspect-video bg-gray-100">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        )}
        {video.isShorts && (
          <span className="absolute left-2 top-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium text-white">
            Shorts
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-medium text-brand-600">{video.companyName}</div>
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:underline"
        >
          {video.title}
        </a>
        <div className="text-xs text-gray-400">{timeAgo(video.publishedAt)}</div>

        <div className="flex gap-3 text-xs text-gray-500">
          <span>조회 {video.viewCount.toLocaleString()}</span>
          <span>좋아요 {video.likeCount.toLocaleString()}</span>
          <span>댓글 {video.commentCount.toLocaleString()}</span>
        </div>

        {video.aiSummary && (
          <p className="mt-1 line-clamp-3 rounded-lg bg-gray-50 p-2 text-xs leading-relaxed text-gray-600">
            {video.aiSummary}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {video.aiContentTypes?.map((t) => (
            <span key={t} className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              {t}
            </span>
          ))}
          {video.aiKeywords?.map((k) => (
            <span key={k} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
              #{k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
