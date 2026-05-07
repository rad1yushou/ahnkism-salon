import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Server Component / Server Action / Route Handler 用 Supabase クライアント。
 * セッション情報を Cookie から読み取ります（認証済みユーザーの権限で動作）。
 * 環境変数が未設定の場合は null を返します。
 *
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY はここでは使用しません。
 *    service_role が必要な処理（将来のseed等）は別途 Route Handler に限定します。
 */
export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 内では set が呼ばれることがあるが無視してよい
        }
      },
    },
  });
}
