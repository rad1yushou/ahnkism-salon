'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// ============================================================
// 共通コンポーネント
// ============================================================
const inputBase =
  'w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white';

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  rows,
  readOnly,
}: {
  label: string;
  value: string | number;
  onChange?: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {readOnly && <span className="text-stone-400 ml-1">（変更不可）</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className={inputBase + ' resize-y' + (readOnly ? ' bg-stone-50 text-stone-400' : '')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          step={type === 'number' ? 'any' : undefined}
          className={inputBase + (readOnly ? ' bg-stone-50 text-stone-400' : '')}
        />
      )}
    </div>
  );
}

// ============================================================
// 型定義
// ============================================================
type NavItem = {
  id: string;
  nav_key: string;
  href: string;
  label: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_locked: boolean;
};

type NavForm = {
  nav_key: string;
  href: string;
  label: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_NAV_FORM: NavForm = {
  nav_key: '',
  href: '',
  label: '',
  icon: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

function toNavForm(item: NavItem): NavForm {
  return {
    nav_key: item.nav_key,
    href: item.href,
    label: item.label,
    icon: item.icon,
    description: item.description,
    sort_order: item.sort_order,
    is_active: item.is_active,
  };
}

// ============================================================
// メインページ
// ============================================================
export default function AdminNavPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NavForm | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<NavForm>({ ...EMPTY_NAV_FORM });
  const [savingNew, setSavingNew] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadItems = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_nav_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const startEdit = (item: NavItem) => {
    setIsAddingNew(false);
    setEditingId(item.id);
    setEditForm(toNavForm(item));
  };
  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const validateForm = (f: NavForm, isNew: boolean): string | null => {
    if (isNew) {
      if (!f.nav_key.trim()) return 'nav_key は必須です';
      if (!/^[a-z0-9_]+$/.test(f.nav_key)) return 'nav_key は英小文字・数字・アンダースコアのみ使用できます';
    }
    if (!f.label.trim()) return 'ラベルは必須です';
    if (!f.href.trim()) return 'リンク先は必須です';
    return null;
  };

  const saveEdit = async (item: NavItem) => {
    if (!supabase || !editForm) return;
    const err = validateForm(editForm, false);
    if (err) { showMessage(err); return; }
    setSaving(true);
    // is_locked の場合 href / nav_key は変更しない
    const payload: Partial<NavForm & { href: string }> = {
      label: editForm.label,
      icon: editForm.icon,
      description: editForm.description,
      sort_order: editForm.sort_order,
      is_active: editForm.is_active,
    };
    if (!item.is_locked) {
      payload.href = editForm.href;
    }
    const { error } = await supabase
      .from('admin_nav_items')
      .update(payload)
      .eq('id', item.id);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadItems();
  };

  const openAddNew = () => {
    cancelEdit();
    const maxSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_NAV_FORM, sort_order: maxSort });
    setIsAddingNew(true);
  };
  const cancelAddNew = () => { setIsAddingNew(false); setNewForm({ ...EMPTY_NAV_FORM }); };

  const addItem = async () => {
    if (!supabase) return;
    const err = validateForm(newForm, true);
    if (err) { showMessage(err); return; }
    setSavingNew(true);
    const { error } = await supabase.from('admin_nav_items').insert({
      nav_key: newForm.nav_key,
      href: newForm.href,
      label: newForm.label,
      icon: newForm.icon,
      description: newForm.description,
      sort_order: newForm.sort_order,
      is_active: newForm.is_active,
      is_locked: false,
    });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newForm.label}」を追加しました`);
    cancelAddNew();
    await loadItems();
  };

  const toggleActive = async (item: NavItem) => {
    if (!supabase) return;
    await supabase.from('admin_nav_items').update({ is_active: !item.is_active }).eq('id', item.id);
    await loadItems();
  };

  const moveItem = async (id: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = items.findIndex((i) => i.id === id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const a = items[idx];
    const b = items[targetIdx];
    await Promise.all([
      supabase.from('admin_nav_items').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('admin_nav_items').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadItems();
  };

  const deleteItem = async (item: NavItem) => {
    if (!supabase || item.is_locked) return;
    if (!window.confirm(`「${item.label}」を削除しますか？この操作は取り消せません。`)) return;
    const { error } = await supabase.from('admin_nav_items').delete().eq('id', item.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${item.label}」を削除しました`);
    if (editingId === item.id) cancelEdit();
    await loadItems();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">管理メニュー 設定</h1>
        <p className="text-xs text-stone-500 mt-1">
          サイドバーとダッシュボードに表示するメニューを管理します。
        </p>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          Supabase の環境変数が設定されていません。
        </div>
      )}

      {message && (
        <div className="bg-stone-800 text-white text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      {/* 新規追加フォーム */}
      {!isAddingNew ? (
        <button
          onClick={openAddNew}
          disabled={!isConfigured}
          className="px-4 py-2 rounded border border-stone-400 text-stone-600 text-xs hover:bg-stone-100 transition-colors disabled:opacity-40"
        >
          + 新規メニューを追加
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-800">新規メニューを追加</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="nav_key（識別キー）"
                value={newForm.nav_key}
                onChange={(v) => setNewForm((p) => ({ ...p, nav_key: v }))}
                placeholder="my_page"
                required
              />
              <Field
                label="アイコン"
                value={newForm.icon}
                onChange={(v) => setNewForm((p) => ({ ...p, icon: v }))}
                placeholder="📄"
              />
            </div>
            <Field
              label="ラベル（表示名）"
              value={newForm.label}
              onChange={(v) => setNewForm((p) => ({ ...p, label: v }))}
              placeholder="ページ管理"
              required
            />
            <Field
              label="リンク先"
              value={newForm.href}
              onChange={(v) => setNewForm((p) => ({ ...p, href: v }))}
              placeholder="/admin/my-page"
              required
            />
            <Field
              label="説明文（ダッシュボード用）"
              value={newForm.description}
              onChange={(v) => setNewForm((p) => ({ ...p, description: v }))}
              placeholder="ページの説明"
              rows={2}
            />
            <div className="flex gap-4 items-end">
              <div className="w-32">
                <Field
                  label="表示順 (sort_order)"
                  value={newForm.sort_order}
                  onChange={(v) => setNewForm((p) => ({ ...p, sort_order: Number(v) }))}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input
                  id="new_is_active"
                  type="checkbox"
                  checked={newForm.is_active}
                  onChange={(e) => setNewForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-stone-300"
                />
                <label htmlFor="new_is_active" className="text-xs text-stone-600">
                  公開する
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={addItem}
                disabled={!isConfigured || savingNew}
                className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
              >
                {savingNew ? '追加中...' : '追加する'}
              </button>
              <button
                onClick={cancelAddNew}
                className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 一覧 */}
      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-stone-400">メニューがありません</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <section key={item.id} className="bg-white border border-stone-200 rounded-lg">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    item.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {item.is_active ? '表示中' : '非表示'}
                  </span>
                  {item.is_locked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-stone-200 text-stone-600">
                      保護
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">
                      <span className="mr-1.5">{item.icon}</span>{item.label}
                    </p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      {item.href}
                      <span className="ml-2 text-stone-300">key: {item.nav_key}</span>
                      <span className="ml-2">sort: {item.sort_order}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={!isConfigured || idx === 0}
                    className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={!isConfigured || idx === items.length - 1}
                    className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      item.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {item.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === item.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                  {!item.is_locked && (
                    <button
                      onClick={() => deleteItem(item)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>

              {editingId === item.id && editForm && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="ラベル（表示名）"
                      value={editForm.label}
                      onChange={(v) => setEditForm((p) => (p ? { ...p, label: v } : p))}
                      placeholder="ページ管理"
                      required
                    />
                    <Field
                      label="アイコン"
                      value={editForm.icon}
                      onChange={(v) => setEditForm((p) => (p ? { ...p, icon: v } : p))}
                      placeholder="📄"
                    />
                  </div>
                  <Field
                    label="リンク先"
                    value={editForm.href}
                    onChange={item.is_locked ? undefined : (v) => setEditForm((p) => (p ? { ...p, href: v } : p))}
                    readOnly={item.is_locked}
                    placeholder="/admin/my-page"
                  />
                  <Field
                    label="説明文（ダッシュボード用）"
                    value={editForm.description}
                    onChange={(v) => setEditForm((p) => (p ? { ...p, description: v } : p))}
                    placeholder="ページの説明"
                    rows={2}
                  />
                  <div className="flex gap-4 items-end">
                    <div className="w-32">
                      <Field
                        label="表示順 (sort_order)"
                        value={editForm.sort_order}
                        onChange={(v) => setEditForm((p) => (p ? { ...p, sort_order: Number(v) } : p))}
                        type="number"
                      />
                    </div>
                    <div className="flex items-center gap-2 pb-1">
                      <input
                        id={`edit_is_active_${item.id}`}
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm((p) => (p ? { ...p, is_active: e.target.checked } : p))}
                        className="rounded border-stone-300"
                      />
                      <label htmlFor={`edit_is_active_${item.id}`} className="text-xs text-stone-600">
                        公開する
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(item)}
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
