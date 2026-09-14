import type { ChannelConfig } from "@/types";

// ============================================================
// YouTube Data API v3 호출을 담당하는 모듈입니다.
// 이 파일만 보면 "유튜브에서 무엇을 어떻게 가져오는지" 전부 알 수 있습니다.
// ============================================================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

export interface YoutubeChannelSnapshot {
  channelId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  uploadsPlaylistId: string; // 이 채널의 "업로드 영상" 재생목록 ID
}

export interface YoutubeVideoSnapshot {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  isShorts: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

// 1) 채널 기본 정보 + 통계 가져오기
export async function fetchChannelSnapshot(
  channelId: string
): Promise<YoutubeChannelSnapshot> {
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${getApiKey()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`채널 정보 조회 실패 (${channelId}): ${res.status}`);
  }
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);

  return {
    channelId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails?.default?.url ?? null,
    subscriberCount: Number(item.statistics.subscriberCount ?? 0),
    videoCount: Number(item.statistics.videoCount ?? 0),
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
}

// 2) 특정 재생목록(업로드 목록)에서 최근 영상 ID 목록 가져오기
//    maxResults 는 한 번에 최대 50개까지 가능 (그 이상은 페이지네이션 필요)
export async function fetchRecentVideoIds(
  uploadsPlaylistId: string,
  maxResults = 15
): Promise<string[]> {
  const url = `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${getApiKey()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`영상 목록 조회 실패 (${uploadsPlaylistId}): ${res.status}`);
  }
  const data = await res.json();
  return (data.items ?? []).map(
    (item: any) => item.contentDetails.videoId as string
  );
}

// 3) 영상 ID들의 상세 정보(통계 포함) 한 번에 가져오기 (최대 50개씩)
export async function fetchVideoDetails(
  videoIds: string[]
): Promise<YoutubeVideoSnapshot[]> {
  if (videoIds.length === 0) return [];

  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(
    ","
  )}&key=${getApiKey()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`영상 상세 조회 실패: ${res.status}`);
  }
  const data = await res.json();

  return (data.items ?? []).map((item: any) => {
    const durationSeconds = parseIsoDuration(item.contentDetails.duration);
    return {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description ?? "",
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.default?.url ??
        "",
      publishedAt: item.snippet.publishedAt,
      durationSeconds,
      // YouTube API가 Shorts 여부를 직접 알려주지 않으므로
      // "60초 이하 + 세로/정사각 영상"일 가능성이 높은 것을 휴리스틱으로 판단합니다.
      // 완전히 정확하지 않을 수 있으니, 필요하면 이 로직을 다듬어주세요.
      isShorts: durationSeconds > 0 && durationSeconds <= 60,
      viewCount: Number(item.statistics?.viewCount ?? 0),
      likeCount: Number(item.statistics?.likeCount ?? 0),
      commentCount: Number(item.statistics?.commentCount ?? 0),
    };
  });
}

// ISO 8601 duration (예: "PT1M30S") -> 초 단위 숫자
function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// 채널 하나를 통째로 동기화할 때 쓰는 조합 함수
export async function fetchFullChannelData(config: ChannelConfig) {
  const channelSnapshot = await fetchChannelSnapshot(config.youtubeChannelId);
  const recentVideoIds = await fetchRecentVideoIds(
    channelSnapshot.uploadsPlaylistId,
    15
  );
  const videos = await fetchVideoDetails(recentVideoIds);
  return { channelSnapshot, videos };
}
