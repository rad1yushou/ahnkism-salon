'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Metadata } from 'next';

// ログインページは admin/layout を使わない独自レイアウト
// admin/layout.tsx のサイドバーはログイン前には不要なため、
// このページは admin/layout を wrap しないよう layout.tsx 側で除外

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) {
      setError('Supabase の環境変数が設定されていません。.env.local を確認してください。');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // TODO: 原因確認後に日本語メッセージへ戻す
      console.log('[authError]', authError.message, authError.status, authError);
      setError(`[debug] ${authError.message}`);
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] text-stone-400 mb-1">AHNKISM</p>
          <h1 className="text-xl tracking-[0.2em] text-stone-800 font-light">管理画面</h1>
        </div>

        {/* フォーム */}
        <form onSubmit={handleLogin} className="bg-white border border-stone-200 p-8 space-y-5">
          <div>
            <label className="block text-xs tracking-widest text-stone-500 mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest text-stone-500 mb-1.5">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 leading-relaxed">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white text-xs tracking-widest py-3 hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-stone-400 tracking-wider">
          管理者アカウントでのみログインできます
        </p>
      </div>
    </div>
  );
}
