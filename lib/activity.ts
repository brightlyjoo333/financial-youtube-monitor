import type { ActivityStatus } from "@/types";

// ============================================================
// "최근 업로드 빈도" 를 기준으로 채널 활성도를 계산합니다.
// 기준을 바꾸고 싶으면 이 파일의 숫자만 수정하면 됩니다.
// ============================================================

export function calculateActivityStatus(
  uploads7d: number,
  uploads30d: number
): ActivityStatus {
  if (uploads7d >= 5) return "Very Active";
  if (uploads7d >= 2) return "Active";
  if (uploads7d >= 1) return "Normal";
  if (uploads30d === 0) return "Inactive";
  // 7일간 업로드는 없었지만 30일 안에는 있었던 애매한 경우 -> Normal 로 처리
  return "Normal";
}

// 업로드 날짜 배열(최신순)로부터 평균 업로드 간격(일)을 계산
export function calculateAvgUploadInterval(
  publishDatesDesc: Date[]
): number | null {
  if (publishDatesDesc.length < 2) return null;

  let totalGapDays = 0;
  for (let i = 0; i < publishDatesDesc.length - 1; i++) {
    const gapMs =
      publishDatesDesc[i].getTime() - publishDatesDesc[i + 1].getTime();
    totalGapDays += gapMs / (1000 * 60 * 60 * 24);
  }
  return totalGapDays / (publishDatesDesc.length - 1);
}

export function countUploadsInWindow(
  publishDates: Date[],
  windowDays: number,
  now: Date = new Date()
): number {
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return publishDates.filter((d) => d >= cutoff).length;
}
