// 로컬 개발 중 "npm run dev" 로 서버를 띄워둔 상태에서
// 다른 터미널 창에서 "npm run sync" 를 실행하면 즉시 동기화를 테스트할 수 있습니다.
// (배포 후에는 Vercel Cron이 자동으로 이 역할을 대신합니다)

const port = process.env.PORT ?? "3000";
const secret = process.env.SYNC_SECRET;

if (!secret) {
  console.error("SYNC_SECRET 환경변수가 필요합니다. .env.local 을 확인하세요.");
  process.exit(1);
}

const url = `http://localhost:${port}/api/sync?secret=${secret}`;

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error("동기화 요청 실패. dev 서버가 실행 중인지 확인하세요:", err.message);
  });
