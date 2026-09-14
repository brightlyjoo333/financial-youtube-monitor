import { createClient } from "@supabase/supabase-js";

// ============================================================
// 브라우저 / 서버 컴포넌트에서 "읽기" 용도로 쓰는 클라이언트
// (RLS 정책으로 읽기만 허용하는 anon key 사용)
// ============================================================
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 채워주세요."
    );
  }

  return createClient(url, key);
}

// ============================================================
// 동기화(수집) 서버 로직에서만 쓰는 관리자 클라이언트
// service_role 키는 절대 브라우저로 노출되면 안 되므로,
// 이 함수는 app/api/sync/route.ts 같은 서버 코드에서만 호출하세요.
// ============================================================
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase 서버 환경변수가 설정되지 않았습니다. .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY 를 채워주세요."
    );
  }

  return createClient(url, serviceKey);
}
