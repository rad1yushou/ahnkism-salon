'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * ブラウザ（クライアントコンポーネント）用 Supabase クライアント。
 * 環境変数が未設定の場合は null を返します。
 * SUPABASE_SERVICE_ROLE_KEY はここでは絶対に使用しません。
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
