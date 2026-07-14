import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// service_role クライアント（サーバー側のみ・クライアントには公開しない）
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase 環境変数が未設定です');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// 呼び出し元が is_admin かどうか確認（anon+cookie セッションで確認）
async function verifyIsAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('admin_user_profiles')
    .select('is_admin, is_active')
    .eq('user_id', user.id)
    .single();

  return profile?.is_admin === true && profile?.is_active === true;
}

// ─────────────────────────────────────────────
// GET /api/admin/users — ユーザー一覧
// ─────────────────────────────────────────────
export async function GET() {
  const isAdmin = await verifyIsAdmin();
  if (!isAdmin) return NextResponse.json({ error: '権限がありません（403 Forbidden）。admin_user_profiles に is_admin=true で登録されているか確認してください。' }, { status: 403 });

  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'admin client 初期化エラー' }, { status: 500 });
  }

  const [authResult, profilesResult, permsResult] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('admin_user_profiles').select('user_id, display_name, is_admin, is_active'),
    adminClient.from('admin_permissions').select('user_id, nav_key, can_view, can_edit'),
  ]);

  if (authResult.error) {
    return NextResponse.json({ error: `auth.admin.listUsers エラー: ${authResult.error.message}` }, { status: 500 });
  }
  if (profilesResult.error) {
    return NextResponse.json({ error: `admin_user_profiles 取得エラー: ${profilesResult.error.message}` }, { status: 500 });
  }
  if (permsResult.error) {
    return NextResponse.json({ error: `admin_permissions 取得エラー: ${permsResult.error.message}` }, { status: 500 });
  }

  const authUsers = authResult.data.users;
  const profiles = profilesResult.data ?? [];
  const allPerms = permsResult.data ?? [];

  const users = profiles.map(profile => {
    const authUser = authUsers.find(u => u.id === profile.user_id);
    const userPerms = allPerms
      .filter(p => p.user_id === profile.user_id)
      .map(p => ({ nav_key: p.nav_key, can_view: p.can_view, can_edit: p.can_edit }));

    return {
      user_id: profile.user_id,
      email: authUser?.email ?? '',
      display_name: profile.display_name,
      is_admin: profile.is_admin,
      is_active: profile.is_active,
      permissions: userPerms,
    };
  });

  return NextResponse.json({ users });
}

// ─────────────────────────────────────────────
// POST /api/admin/users — ユーザー新規作成
// ─────────────────────────────────────────────
export async function POST(request: Request) {
  const isAdmin = await verifyIsAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { email, password, display_name, is_admin, permissions } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Supabase Auth ユーザー作成
  const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !authData.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'ユーザー作成に失敗しました' },
      { status: 500 }
    );
  }

  const newUserId = authData.user.id;

  // プロファイル作成
  const { error: profileError } = await adminClient
    .from('admin_user_profiles')
    .insert({
      user_id: newUserId,
      display_name: display_name || email,
      is_admin: is_admin ?? false,
      is_active: true,
    });

  if (profileError) {
    // auth.users には登録済みだがプロファイル失敗 → user_id を返して手動確認可能にする
    return NextResponse.json(
      {
        error: 'プロファイル作成に失敗しました。auth.users には登録済みです。',
        user_id: newUserId,
        detail: profileError.message,
      },
      { status: 500 }
    );
  }

  // 権限 UPSERT
  if (permissions && permissions.length > 0) {
    const { error: permError } = await adminClient
      .from('admin_permissions')
      .upsert(
        permissions.map((p: { nav_key: string; can_view: boolean; can_edit: boolean }) => ({
          user_id: newUserId,
          nav_key: p.nav_key,
          can_view: p.can_view,
          can_edit: p.can_edit,
        })),
        { onConflict: 'user_id,nav_key' }
      );

    if (permError) {
      return NextResponse.json(
        {
          error: '権限設定に失敗しました。ユーザーとプロファイルは作成済みです。',
          user_id: newUserId,
          detail: permError.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, user_id: newUserId });
}

// ─────────────────────────────────────────────
// PATCH /api/admin/users — ユーザー更新
// ─────────────────────────────────────────────
export async function PATCH(request: Request) {
  const isAdmin = await verifyIsAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { user_id, display_name, is_admin, is_active, permissions } = body;

  if (!user_id) {
    return NextResponse.json({ error: 'user_id が必要です' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // プロファイル更新
  const updateData: Record<string, unknown> = {};
  if (display_name !== undefined) updateData.display_name = display_name;
  if (is_admin     !== undefined) updateData.is_admin     = is_admin;
  if (is_active    !== undefined) updateData.is_active    = is_active;

  if (Object.keys(updateData).length > 0) {
    const { error: profileError } = await adminClient
      .from('admin_user_profiles')
      .update(updateData)
      .eq('user_id', user_id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  // 権限 UPSERT（全 nav_key を上書き。未チェック = can_view/can_edit が false のまま保存）
  if (permissions && permissions.length > 0) {
    const { error: permError } = await adminClient
      .from('admin_permissions')
      .upsert(
        permissions.map((p: { nav_key: string; can_view: boolean; can_edit: boolean }) => ({
          user_id,
          nav_key: p.nav_key,
          can_view: p.can_view,
          can_edit: p.can_edit,
        })),
        { onConflict: 'user_id,nav_key' }
      );

    if (permError) {
      return NextResponse.json({ error: permError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
