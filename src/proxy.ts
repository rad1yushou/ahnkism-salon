import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login は認証不要（常に通過）
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数未設定時 → 安全側に倒して /admin/login へリダイレクト
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Supabase セッション確認（Cookie ベース）
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() でサーバー側セッションを検証
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 未認証 → /admin/login にリダイレクト
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 認証済み → セッション Cookie を更新して通過
  return supabaseResponse;
}

export const config = {
  // /admin/login を除く /admin/* のみ対象
  matcher: ['/admin/:path*'],
};
