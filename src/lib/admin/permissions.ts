import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminProfile = {
  user_id: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
};

export type PagePermission = {
  nav_key: string;
  can_view: boolean;
  can_edit: boolean;
};

// ─────────────────────────────────────────────
// getCurrentAdminProfile
// ログイン中ユーザーのプロファイルを取得。
// プロファイル未登録・is_active=false → /admin/login へリダイレクト。
// ─────────────────────────────────────────────
export async function getCurrentAdminProfile(): Promise<AdminProfile> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/admin/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('admin_user_profiles')
    .select('user_id, display_name, is_admin, is_active')
    .eq('user_id', user.id)
    .single();

  if (!profile || !profile.is_active) redirect('/admin/login');

  return profile as AdminProfile;
}

// ─────────────────────────────────────────────
// getCurrentAdminPermissions
// ログイン中ユーザーの全権限レコードを取得。
// is_admin の場合も空配列を返す（呼び出し側で is_admin を先に確認すること）。
// ─────────────────────────────────────────────
export async function getCurrentAdminPermissions(): Promise<PagePermission[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('admin_permissions')
    .select('nav_key, can_view, can_edit')
    .eq('user_id', user.id);

  return (data ?? []) as PagePermission[];
}

// ─────────────────────────────────────────────
// requireViewPermission
// ページ閲覧チェック用。
// is_admin → 通過。can_view=true → 通過。
// それ以外 → /admin/dashboard へリダイレクト。
// ─────────────────────────────────────────────
export async function requireViewPermission(navKey: string): Promise<void> {
  const profile = await getCurrentAdminProfile();
  if (profile.is_admin) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/admin/dashboard');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: perm } = await supabase
    .from('admin_permissions')
    .select('can_view')
    .eq('user_id', user.id)
    .eq('nav_key', navKey)
    .single();

  if (!perm?.can_view) redirect('/admin/dashboard');
}

// ─────────────────────────────────────────────
// getPagePermission
// 指定ページの can_view / can_edit を取得して返すだけ。
// リダイレクトしない。ボタン表示制御に使う。
// is_admin の場合は { nav_key, can_view: true, can_edit: true } を返す。
// ─────────────────────────────────────────────
export async function getPagePermission(navKey: string): Promise<PagePermission> {
  const profile = await getCurrentAdminProfile();
  if (profile.is_admin) {
    return { nav_key: navKey, can_view: true, can_edit: true };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { nav_key: navKey, can_view: false, can_edit: false };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { nav_key: navKey, can_view: false, can_edit: false };

  const { data: perm } = await supabase
    .from('admin_permissions')
    .select('can_view, can_edit')
    .eq('user_id', user.id)
    .eq('nav_key', navKey)
    .single();

  return {
    nav_key: navKey,
    can_view: perm?.can_view ?? false,
    can_edit: perm?.can_edit ?? false,
  };
}

// ─────────────────────────────────────────────
// requireEditPermission
// 保存・追加・削除などの書き込み操作の直前に呼ぶ。
// is_admin → 通過。can_edit=true → 通過。
// それ以外 → /admin/dashboard へリダイレクト。
// ※ API Route で使う場合は 403 JSON を返す専用関数を別途追加予定。
// ─────────────────────────────────────────────
export async function requireEditPermission(navKey: string): Promise<void> {
  const profile = await getCurrentAdminProfile();
  if (profile.is_admin) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/admin/dashboard');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: perm } = await supabase
    .from('admin_permissions')
    .select('can_edit')
    .eq('user_id', user.id)
    .eq('nav_key', navKey)
    .single();

  if (!perm?.can_edit) redirect('/admin/dashboard');
}
