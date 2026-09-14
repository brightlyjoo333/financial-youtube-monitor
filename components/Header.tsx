interface HeaderProps {
  lastSyncedAt: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "동기화 기록 없음";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Header({ lastSyncedAt }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Financial YouTube Content Monitor
          </h1>
          <p className="text-sm text-gray-500">경쟁 금융사 YouTube 콘텐츠 모니터링</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>최근 업데이트</div>
          <div className="font-medium text-gray-700">{formatDateTime(lastSyncedAt)}</div>
        </div>
      </div>
    </header>
  );
}
