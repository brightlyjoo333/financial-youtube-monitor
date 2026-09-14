import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial YouTube Content Monitor",
  description: "경쟁 금융사 YouTube 콘텐츠 모니터링 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
