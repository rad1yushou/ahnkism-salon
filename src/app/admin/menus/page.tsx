'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Menu = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  long_description: string | null;
  price: string | null;
  duration: string | null;
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  name: string;
  short_name: string | null;
  description: string | null;
  long_description: string | null;
  price: string | null;
  duration: string | null;
  sort_order: number;
  is_active: boolean;
};

type NewForm = {
  slug: string;
  name: string;
  short_name: string;
  description: string;
  long_description: string;
  price: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
};

function toEditForm(menu: Menu): EditForm {
  return {
    name: menu.name,
    short_name: menu.short_name,
    description: menu.description,
    long_description: menu.long_description,
    price: menu.price,
    duration: menu.duration,
    sort_order: menu.sort_order,
    is_active: menu.is_active,
  };
}

function parseFeaturedCount(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(Math.max(Math.round(n), 1), 12);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  rows,
}: {
  label: string;
  value: string | number | null;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
}) {
  const base =
    'w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white';

  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={base + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className={base}
        />
      )}
    </div>
  );
}

export default function AdminMenusPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  const [featuredCount, setFeaturedCount] = useState<number>(6);
  const [featuredCountInput, setFeaturedCountInput] = useState<string>('6');
  const [savingCount, setSavingCount] = useState(false);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<NewForm | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const [menusRes, settingsRes] = await Promise.all([
      supabase
        .from('menus')
        .select('id, slug, name, short_name, description, long_description, price, duration, sort_order, is_active')
        .order('sort_order', { ascending: true }),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_menu_count')
        .maybeSingle(),
    ]);

    if (menusRes.error) {
      showMessage(`取得失敗: ${menusRes.error.message}`);
    } else {
      setMenus(menusRes.data ?? []);
    }

    const count = parseFeaturedCount(settingsRes.data?.value);
    setFeaturedCount(count);
    setFeaturedCountInput(String(count));

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── 既存メニュー編集 ──────────────────────────────────
  const startEdit = (menu: Menu) => {
    setIsAddingNew(false);
    setNewForm(null);
    setEditingId(menu.id);
    setForm(toEditForm(menu));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const saveEdit = async (menuId: string) => {
    if (!supabase || !form) return;
    setSaving(true);
    const { error } = await supabase
      .from('menus')
      .update({
        name: form.name,
        short_name: form.short_name || null,
        description: form.description || null,
        long_description: form.long_description || null,
        price: form.price || null,
        duration: form.duration || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', menuId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const toggleActive = async (menu: Menu) => {
    if (!supabase) return;
    await supabase
      .from('menus')
      .update({ is_active: !menu.is_active })
      .eq('id', menu.id);
    await loadData();
  };

  // ── 表示件数設定 ─────────────────────────────────────
  const saveFeaturedCount = async () => {
    if (!supabase) return;
    const n = parseFeaturedCount(featuredCountInput);
    setSavingCount(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'featured_menu_count', value: String(n) }, { onConflict: 'key' });
    setSavingCount(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    setFeaturedCount(n);
    setFeaturedCountInput(String(n));
    showMessage(`人気メニュー表示件数を ${n} 件に設定しました`);
  };

  // ── 新規メニュー追加 ─────────────────────────────────
  const openAddNew = () => {
    cancelEdit();
    const maxOrder = menus.length > 0 ? Math.max(...menus.map(m => m.sort_order)) : 0;
    setNewForm({
      slug: '',
      name: '',
      short_name: '',
      description: '',
      long_description: '',
      price: '',
      duration: '',
      sort_order: maxOrder + 1,
      is_active: true,
    });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewForm(null);
  };

  const setNewField = <K extends keyof NewForm>(key: K, value: NewForm[K]) => {
    setNewForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const addMenu = async () => {
    if (!supabase || !newForm) return;

    // slug バリデーション
    if (!newForm.slug.trim()) {
      showMessage('slug を入力してください');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(newForm.slug)) {
      showMessage('slug は英小文字・数字・ハイフンのみ使用できます');
      return;
    }
    // name バリデーション
    if (!newForm.name.trim()) {
      showMessage('メニュー名を入力してください');
      return;
    }
    // slug 重複チェック（既存一覧内）
    if (menus.some(m => m.slug === newForm.slug.trim())) {
      showMessage(`slug "${newForm.slug}" はすでに存在します`);
      return;
    }

    setSavingNew(true);
    const { error } = await supabase.from('menus').insert({
      slug: newForm.slug.trim(),
      name: newForm.name.trim(),
      short_name: newForm.short_name.trim() || null,
      description: newForm.description.trim() || null,
      long_description: newForm.long_description.trim() || null,
      price: newForm.price.trim() || null,
      duration: newForm.duration.trim() || null,
      sort_order: newForm.sort_order,
      is_active: newForm.is_active,
    });
    setSavingNew(false);

    if (error) {
      // DB の UNIQUE 制約違反も含めてエラー表示
      showMessage(`追加失敗: ${error.message}`);
      return;
    }

    showMessage(`"${newForm.name}" を追加しました`);
    cancelAddNew();
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">メニュー管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          メニュー情報を編集します。slug はURLに影響するため変更できません。
        </p>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          ⚠️ Supabase の環境変数が設定されていません。<br />
          <code className="text-xs">.env.local</code> に{' '}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> と{' '}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
          を設定してください。
        </div>
      )}

      {message && (
        <div className="bg-stone-800 text-white text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      {/* ── 表示設定 ── */}
      <section className="bg-white border border-stone-200 rounded-lg px-5 py-4">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider mb-4">表示設定</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
              トップページ 人気メニュー表示件数
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={featuredCountInput}
                onChange={e => setFeaturedCountInput(e.target.value)}
                disabled={!isConfigured}
                className="w-20 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white disabled:bg-stone-50"
              />
              <span className="text-xs text-stone-400">件（1〜12）</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">現在の設定: {featuredCount} 件</p>
          </div>
          <button
            onClick={saveFeaturedCount}
            disabled={!isConfigured || savingCount}
            className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
          >
            {savingCount ? '保存中...' : '保存'}
          </button>
        </div>
      </section>

      {/* ── 新規追加ボタン ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider">メニュー一覧</h2>
        <button
          onClick={isAddingNew ? cancelAddNew : openAddNew}
          disabled={!isConfigured}
          className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-40 ${
            isAddingNew
              ? 'border-stone-300 text-stone-500 hover:bg-stone-50'
              : 'border-stone-400 text-stone-600 hover:bg-stone-50'
          }`}
        >
          {isAddingNew ? '✕ キャンセル' : '＋ 新規メニューを追加'}
        </button>
      </div>

      {/* ── 新規追加フォーム ── */}
      {isAddingNew && newForm && (
        <section className="bg-white border border-stone-300 border-dashed rounded-lg px-5 py-5 space-y-5">
          <p className="text-xs font-medium text-stone-700 tracking-wider">新規メニューを追加</p>

          {/* slug・メニュー名 */}
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
                  slug<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={newForm.slug}
                  onChange={e => setNewField('slug', e.target.value.toLowerCase())}
                  placeholder="new-menu"
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">英小文字・数字・ハイフンのみ</p>
              </div>
              <Field
                label="メニュー名"
                value={newForm.name}
                onChange={v => setNewField('name', v)}
                placeholder="髪質改善トリートメント"
                required
              />
            </div>
            <div className="mt-3">
              <Field
                label="短縮名"
                value={newForm.short_name}
                onChange={v => setNewField('short_name', v)}
                placeholder="髪質改善"
              />
            </div>
          </div>

          {/* 説明文 */}
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">説明文</p>
            <div className="space-y-3">
              <Field
                label="短い説明（一覧・SEO用）"
                value={newForm.description}
                onChange={v => setNewField('description', v)}
                placeholder="大阪・心斎橋のAHNKISMが提供する..."
                rows={2}
              />
              <Field
                label="詳細説明（詳細ページ用）"
                value={newForm.long_description}
                onChange={v => setNewField('long_description', v)}
                placeholder="ダメージを補修しながら..."
                rows={4}
              />
            </div>
          </div>

          {/* 料金・所要時間 */}
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">料金・所要時間</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="料金"
                value={newForm.price}
                onChange={v => setNewField('price', v)}
                placeholder="¥15,000〜"
              />
              <Field
                label="所要時間"
                value={newForm.duration}
                onChange={v => setNewField('duration', v)}
                placeholder="約2〜3時間"
              />
            </div>
          </div>

          {/* 表示設定 */}
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
            <div className="flex items-center gap-4">
              <Field
                label="表示順 (sort_order)"
                value={newForm.sort_order}
                onChange={v => setNewField('sort_order', Number(v))}
                placeholder="7"
                type="number"
              />
              <div className="flex items-center gap-2 pt-5">
                <input
                  id="new-active"
                  type="checkbox"
                  checked={newForm.is_active}
                  onChange={e => setNewField('is_active', e.target.checked)}
                  className="rounded border-stone-300"
                />
                <label htmlFor="new-active" className="text-xs text-stone-600 whitespace-nowrap">
                  公開する
                </label>
              </div>
            </div>
          </div>

          {/* 注意書き */}
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ※ 追加後、詳細ページ /menu/&#123;slug&#125; は動的ルート未対応のため 404 になります。一覧・トップページには反映されます。
          </p>

          {/* 保存・キャンセル */}
          <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
            <button
              onClick={addMenu}
              disabled={!isConfigured || savingNew}
              className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
            >
              {savingNew ? '保存中...' : '追加する'}
            </button>
            <button
              onClick={cancelAddNew}
              className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </section>
      )}

      {/* ── メニュー一覧 ── */}
      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : menus.length === 0 ? (
        <p className="text-xs text-stone-400">メニューデータがありません</p>
      ) : (
        <div className="space-y-4">
          {menus.map(menu => (
            <section key={menu.id} className="bg-white border border-stone-200 rounded-lg">

              {/* ── カードヘッダー ── */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    menu.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {menu.is_active ? '公開中' : '非表示中'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">
                      {menu.name}
                    </p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      slug: <span className="font-mono">{menu.slug}</span>
                      　sort: {menu.sort_order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(menu)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      menu.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {menu.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === menu.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      ✕ 閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(menu)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>

              {/* ── 編集フォーム ── */}
              {editingId === menu.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-5">

                  {/* 基本情報 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="メニュー名"
                        value={form.name}
                        onChange={v => setField('name', v)}
                        placeholder="髪質改善トリートメント"
                        required
                      />
                      <Field
                        label="短縮名"
                        value={form.short_name}
                        onChange={v => setField('short_name', v)}
                        placeholder="髪質改善"
                      />
                    </div>
                  </div>

                  {/* 説明文 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">説明文</p>
                    <div className="space-y-3">
                      <Field
                        label="短い説明（一覧・SEO用）"
                        value={form.description}
                        onChange={v => setField('description', v)}
                        placeholder="大阪・心斎橋のAHNKISMが提供する..."
                        rows={2}
                      />
                      <Field
                        label="詳細説明（詳細ページ用）"
                        value={form.long_description}
                        onChange={v => setField('long_description', v)}
                        placeholder="ダメージを補修しながら..."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* 料金・所要時間 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">料金・所要時間</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="料金"
                        value={form.price}
                        onChange={v => setField('price', v)}
                        placeholder="¥15,000〜"
                      />
                      <Field
                        label="所要時間"
                        value={form.duration}
                        onChange={v => setField('duration', v)}
                        placeholder="約2〜3時間"
                      />
                    </div>
                  </div>

                  {/* 表示設定 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
                    <div className="flex items-center gap-4">
                      <Field
                        label="表示順 (sort_order)"
                        value={form.sort_order}
                        onChange={v => setField('sort_order', Number(v))}
                        placeholder="1"
                        type="number"
                      />
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          id={`active-${menu.id}`}
                          type="checkbox"
                          checked={form.is_active}
                          onChange={e => setField('is_active', e.target.checked)}
                          className="rounded border-stone-300"
                        />
                        <label htmlFor={`active-${menu.id}`} className="text-xs text-stone-600 whitespace-nowrap">
                          公開する
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(menu.id)}
                      disabled={!isConfigured || saving}
                      className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
