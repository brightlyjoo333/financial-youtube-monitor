# Financial YouTube Content Monitor

경쟁 금융사 YouTube 채널을 자동으로 모니터링하고, AI가 콘텐츠 트렌드와 전략적 인사이트까지
분석해주는 대시보드입니다.

## 전체 구조 한눈에 보기

```
[YouTube Data API]
      │  (채널 통계 + 최근 영상)
      ▼
/api/sync  ──► AI 분석(lib/ai-analysis.ts) ──► Supabase (channels / videos / market_insights)
                                                        │
                                                        ▼
                                              대시보드 화면 (app/page.tsx)
```

- **데이터는 매번 YouTube에서 직접 불러오지 않습니다.** `/api/sync` 가 주기적으로(또는 수동으로)
  실행되어 YouTube → AI 분석 → Supabase 저장까지 끝내놓고, 화면은 Supabase만 읽습니다.
  그래서 화면 로딩이 빠르고, YouTube API 사용량도 절약됩니다.
- 코드를 고칠 때 어디를 봐야 하는지 감을 잡으려면 아래 "폴더 구조" 설명을 먼저 읽어보세요.

## 폴더 구조와 각 파일의 역할

```
config/channels.ts       모니터링할 채널 목록 (채널 추가/삭제는 여기만 수정)
types/index.ts            데이터 모양 정의 (필드 추가 시 여기부터 수정)

lib/youtube.ts             YouTube Data API 호출 (여기서만 YouTube를 직접 부름)
lib/activity.ts            채널 활성도(Very Active 등) 계산 로직
lib/ai-analysis.ts         AI 분석 로직 (Claude ↔ OpenAI 교체는 여기서만)
lib/stats.ts                KPI/기간비교/트렌드 키워드 계산 (순수 계산, DB/API 호출 없음)
lib/supabase.ts             Supabase 클라이언트 생성
lib/data.ts                  Supabase에서 데이터 읽어와서 화면용 타입으로 변환

supabase/schema.sql         Supabase에 만들어야 할 테이블 정의 (최초 1회 실행)

app/api/sync/route.ts       전체 파이프라인 실행 (YouTube 수집 → AI 분석 → Supabase 저장)
app/page.tsx                 대시보드 페이지 (서버에서 Supabase 데이터를 불러옴)
app/layout.tsx               공통 레이아웃

components/Dashboard.tsx    화면 전체를 조립하는 메인 컴포넌트 (필터 상태 관리)
components/*.tsx             화면의 각 영역 (KPI 카드, 비교표, AI 인사이트, 영상 카드 등)
```

**수정 팁**
- 모니터링 채널 추가/삭제 → `config/channels.ts`
- 활성도 기준 숫자 바꾸기 (예: "5개 이상"을 "3개 이상"으로) → `lib/activity.ts`
- KPI 카드 문구/항목 바꾸기 → `components/KpiCards.tsx`
- AI에게 시키는 질문(프롬프트) 바꾸기 → `lib/ai-analysis.ts`
- Claude ↔ OpenAI 전환 → `.env.local`의 `AI_PROVIDER` 값만 변경

---

## 1. 로컬에서 실행하기

```bash
npm install
cp .env.local.example .env.local
# .env.local 파일을 열어서 아래 "2. 환경변수 준비"에서 발급받은 값들을 채워넣기
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 2. 환경변수 준비

### (1) YouTube Data API Key
1. [Google Cloud Console](https://console.cloud.google.com/) 접속 → 프로젝트 생성
2. "API 및 서비스" → "라이브러리" → **YouTube Data API v3** 검색 후 사용 설정
3. "사용자 인증 정보" → "API 키 만들기" → 발급된 키를 `YOUTUBE_API_KEY` 에 입력

무료 할당량(일 10,000 units)으로 채널 26개를 시간 단위로 동기화하는 정도는 충분합니다.

### (2) Supabase
1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. 왼쪽 메뉴 "SQL Editor" → `supabase/schema.sql` 파일 내용을 전체 복사해서 붙여넣고 실행
   (channels, videos, market_insights 테이블이 생성됩니다)
3. "Project Settings" → "API" 메뉴에서:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 외부에 노출 금지, 서버 전용)

### (3) AI API (Claude 또는 OpenAI 중 하나만 있어도 동작)
- Claude: https://console.anthropic.com 에서 API 키 발급 → `ANTHROPIC_API_KEY`
- OpenAI: https://platform.openai.com 에서 API 키 발급 → `OPENAI_API_KEY`
- 어떤 것을 쓸지 `.env.local`의 `AI_PROVIDER` 를 `claude` 또는 `openai` 로 설정

### (4) 채널 ID 채워넣기
`config/channels.ts` 안의 `REPLACE_WITH_CHANNEL_ID` 를 실제 채널 ID로 바꿔야 합니다.
채널 페이지 → "채널 정보" → "채널 공유" → "채널 ID 복사" 로 확인할 수 있습니다.

### (5) 동기화 보호용 비밀번호
`SYNC_SECRET` 에 아무 랜덤 문자열이나 넣어주세요 (예: `kyobo-monitor-2026-secret`).
이 값을 모르는 사람은 `/api/sync` 를 실행시킬 수 없습니다.

## 3. 데이터 처음 채워넣기 (최초 동기화)

로컬에서 `npm run dev` 를 켜둔 상태에서, 브라우저 주소창에 아래처럼 입력:

```
http://localhost:3000/api/sync?secret=여기에_SYNC_SECRET_값
```

몇 분 정도 걸릴 수 있습니다 (채널 26개 × YouTube 조회 + 신규 영상 AI 분석).
완료되면 JSON 결과가 뜨고, http://localhost:3000 대시보드에 데이터가 채워집니다.

## 4. Vercel에 배포하기

1. 이 프로젝트를 GitHub 저장소에 올리기
2. [vercel.com](https://vercel.com) → "Add New Project" → 방금 만든 GitHub 저장소 선택
3. 배포 설정 화면에서 "Environment Variables" 에 `.env.local` 에 있는 값을 **하나하나 그대로** 입력
   (YOUTUBE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY 또는 OPENAI_API_KEY, AI_PROVIDER, SYNC_SECRET)
4. "Deploy" 클릭 → 배포 완료되면 `https://프로젝트이름.vercel.app` 주소가 생성됩니다.
5. 배포된 주소 뒤에 `/api/sync?secret=...` 를 붙여서 한 번 방문하면 실제 데이터가 채워집니다.

### 자동 동기화 (Vercel Cron)

`vercel.json` 에 이미 매시간 정각에 `/api/sync` 를 자동 호출하도록 설정해뒀습니다.

```json
{
  "crons": [{ "path": "/api/sync?secret=REPLACE_WITH_SYNC_SECRET", "schedule": "0 * * * *" }]
}
```

**주의**: `REPLACE_WITH_SYNC_SECRET` 부분을 실제 `SYNC_SECRET` 값으로 바꿔서 GitHub에 커밋해야
Cron이 정상 동작합니다 (Vercel의 무료 Hobby 플랜은 Cron이 하루 1회로 제한되니, 팀에서 쓰는
Pro 플랜 여부에 따라 `schedule` 값을 조정하세요. 예: 하루 1회는 `"0 9 * * *"`).

## 5. 자주 하는 커스터마이징

| 하고 싶은 것 | 수정할 파일 |
|---|---|
| 채널 추가/삭제 | `config/channels.ts` |
| 활성도 기준 변경 | `lib/activity.ts` |
| AI 프롬프트/질문 내용 변경 | `lib/ai-analysis.ts` |
| Claude ↔ OpenAI 전환 | `.env.local` 의 `AI_PROVIDER` |
| KPI 카드 종류/문구 | `components/KpiCards.tsx` |
| 콘텐츠 카드 디자인 | `components/VideoCard.tsx` |
| 필터 옵션 추가 | `components/Filters.tsx` + `components/Dashboard.tsx`의 `applyFilters` |
| 색상/브랜드 컬러 | `tailwind.config.ts` |

## 6. 알아두면 좋은 한계점

- **Shorts 판별**: YouTube API가 "이건 Shorts입니다"라고 직접 알려주지 않기 때문에,
  영상 길이가 60초 이하이면 Shorts로 추정하는 방식(`lib/youtube.ts`)을 쓰고 있습니다.
  완벽하지 않을 수 있으니 참고용으로 봐주세요.
- **AI 분석 비용**: 새로 발견된 영상만 분석하고, 이미 분석된 영상은 재분석하지 않도록
  설계했습니다 (`app/api/sync/route.ts`). 채널 수/업로드 빈도에 따라 API 비용을 미리
  가늠해보는 것을 권장합니다.
- **채널당 최근 영상 조회 개수**: 기본값은 한 번에 15개입니다 (`lib/youtube.ts`의
  `fetchRecentVideoIds` 두 번째 인자). 특정 채널이 하루에 15개 넘게 업로드하는 경우가
  아니라면 충분합니다.
