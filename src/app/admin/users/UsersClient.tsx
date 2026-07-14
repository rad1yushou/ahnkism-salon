'use client';

import { useState, useEffect, useCallback } from 'react';

type Permission = { nav_key: string; can_view: boolean; can_edit: boolean };

type UserRecord = {
  user_id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
  permissions: Permission[];
};

type FormState = {
  email: string;
  password: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
  permissions: Permission[];
};

const PERMISSION_PAGES = [
  { nav_key: 'salon_lp',      label: '店舗LP' },
  { nav_key: 'blogs',         label: 'ブログ管理' },
  { nav_key: 'staff',         label: 'スタッフ管理' },
  { nav_key: 'salons',        label: '店舗管理' },
  { nav_key: 'menus',         label: 'メニュー管理' },
  { nav_key: 'reasons',       label: '選ばれる理由' },
  { nav_key: 'results',       label: '施術実績' },
  { nav_key: 'home_sections', label: 'ページ構成' },
  { nav_key: 'reviews',       label: '口コミ管理' },
  { nav_key: 'recruit',       label: '採用管理' },
  { nav_key: 'about',         label: 'グループ紹介' },
  { nav_key: 'nav',           label: '管理メニュー' },
  { nav_key: 'images',        label: '画像管理' },
];

function emptyForm(): FormState {
  return {
    email: '',
    password: '',
    display_name: '',
    is_admin: false,
    is_active: true,
    permissions: PERMISSION_PAGES.map(p => ({ nav_key: p.nav_key, can_view: false, can_edit: false })),
  };
}

function userToForm(user: UserRecord): FormState {
  return {
    email: user.email,
    password: '',
    display_name: user.display_name,
    is_admin: user.is_admin,
    is_active: user.is_active,
    permissions: PERMISSION_PAGES.map(p => {
      const existing = user.permissions.find(up => up.nav_key === p.nav_key);
      return { nav_key: p.nav_key, can_view: existing?.can_view ?? false, can_edit: existing?.can_edit ?? false };
    }),
  };
}

export default function UsersClient() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        const msg = [data.error, data.detail].filter(Boolean).join(' / ');
        throw new Error(`[${res.status}] ${msg || 'ユーザー一覧の取得に失敗しました'}`);
      }
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得エラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openNew() {
    setForm(emptyForm());
    setFormError('');
    setEditingId('new');
  }

  function openEdit(user: UserRecord) {
    setForm(userToForm(user));
    setFormError('');
    setEditingId(user.user_id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError('');
  }

  function setPermission(nav_key: string, field: 'can_view' | 'can_edit', value: boolean) {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.nav_key !== nav_key) return p;
        // can_edit ON → can_view も ON
        if (field === 'can_edit' && value) return { ...p, can_view: true, can_edit: true };
        // can_view OFF → can_edit も OFF
        if (field === 'can_view' && !value) return { ...p, can_view: false, can_edit: false };
        return { ...p, [field]: value };
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFormError('');
    try {
      let res: Response;
      if (editingId === 'new') {
        if (!form.email || !form.password) {
          setFormError('メールアドレスとパスワードは必須です');
          setSaving(false);
          return;
        }
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            display_name: form.display_name || form.email,
            is_admin: form.is_admin,
            permissions: form.permissions,
          }),
        });
      } else {
        res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: editingId,
            display_name: form.display_name,
            is_admin: form.is_admin,
            is_active: form.is_active,
            permissions: form.permissions,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? '保存に失敗しました');
        setSaving(false);
        return;
      }

      await loadUsers();
      closeForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存エラー');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm tracking-[0.2em] text-stone-800">ユーザー管理</h1>
          <p className="text-xs text-stone-400 mt-0.5">管理画面にログインできるユーザーを管理します</p>
        </div>
        {editingId === null && (
          <button
            onClick={openNew}
            className="text-xs tracking-wider text-white bg-stone-800 px-4 py-2 hover:bg-stone-700 transition-colors"
          >
            + ユーザー追加
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {/* ユーザー一覧 */}
      {!loading && editingId === null && (
        <div className="border border-stone-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 font-normal tracking-wider text-stone-500">表示名</th>
                <th className="text-left px-4 py-3 font-normal tracking-wider text-stone-500">メール</th>
                <th className="text-center px-4 py-3 font-normal tracking-wider text-stone-500">管理者</th>
                <th className="text-center px-4 py-3 font-normal tracking-wider text-stone-500">有効</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 text-stone-700">{user.display_name || '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{user.email}</td>
                  <td className="px-4 py-3 text-center text-stone-500">{user.is_admin ? '✓' : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={user.is_active ? 'text-green-600' : 'text-stone-300'}>
                      {user.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-xs text-stone-500 border border-stone-300 px-3 py-1 hover:border-stone-500 transition-colors"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    ユーザーが登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p className="text-xs text-stone-400">読み込み中...</p>}

      {/* 追加 / 編集フォーム */}
      {editingId !== null && (
        <div className="border border-stone-200 bg-white p-6">
          <h2 className="text-xs tracking-widest text-stone-600 mb-5">
            {editingId === 'new' ? 'ユーザー追加' : 'ユーザー編集'}
          </h2>

          <div className="space-y-4 mb-6">
            {/* 表示名 */}
            <div>
              <label className="block text-xs tracking-widest text-stone-500 mb-1.5">表示名</label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                className="w-full max-w-sm border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
                placeholder="山田 太郎"
              />
            </div>

            {/* メール */}
            <div>
              <label className="block text-xs tracking-widest text-stone-500 mb-1.5">
                メールアドレス
                {editingId === 'new' && <span className="text-red-400 ml-1">*</span>}
              </label>
              {editingId === 'new' ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full max-w-sm border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
                  placeholder="user@example.com"
                />
              ) : (
                <p className="text-sm text-stone-400 py-1">{form.email}</p>
              )}
            </div>

            {/* パスワード（新規時のみ） */}
            {editingId === 'new' && (
              <div>
                <label className="block text-xs tracking-widest text-stone-500 mb-1.5">
                  パスワード<span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full max-w-sm border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* 管理者フラグ */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={e => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-stone-700"
                />
                <span className="text-xs tracking-wider text-stone-600">
                  管理者権限（全ページにアクセス可）
                </span>
              </label>
            </div>

            {/* 有効/無効（編集時のみ） */}
            {editingId !== 'new' && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-stone-700"
                  />
                  <span className="text-xs tracking-wider text-stone-600">
                    有効（チェックを外すとログイン後もアクセス不可）
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ページ権限 */}
          <div className={form.is_admin ? 'opacity-40 pointer-events-none select-none' : ''}>
            <p className="text-xs tracking-widest text-stone-500 mb-3">
              ページ権限
              {form.is_admin && (
                <span className="ml-2 text-stone-400 normal-case tracking-normal">
                  （管理者フラグONのため設定不要）
                </span>
              )}
            </p>
            <div className="border border-stone-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left px-4 py-2.5 font-normal tracking-wider text-stone-500">ページ</th>
                    <th className="text-center px-4 py-2.5 font-normal tracking-wider text-stone-500 w-28">
                      閲覧（can_view）
                    </th>
                    <th className="text-center px-4 py-2.5 font-normal tracking-wider text-stone-500 w-28">
                      編集（can_edit）
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_PAGES.map(page => {
                    const perm = form.permissions.find(p => p.nav_key === page.nav_key) ?? {
                      can_view: false,
                      can_edit: false,
                    };
                    return (
                      <tr key={page.nav_key} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-2.5 text-stone-600">{page.label}</td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_view}
                            onChange={e => setPermission(page.nav_key, 'can_view', e.target.checked)}
                            className="w-3.5 h-3.5 accent-stone-700"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_edit}
                            onChange={e => setPermission(page.nav_key, 'can_edit', e.target.checked)}
                            className="w-3.5 h-3.5 accent-stone-700"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {formError && <p className="text-xs text-red-500 mt-4">{formError}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs tracking-wider text-white bg-stone-800 px-5 py-2 hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={closeForm}
              disabled={saving}
              className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-2 hover:border-stone-500 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
