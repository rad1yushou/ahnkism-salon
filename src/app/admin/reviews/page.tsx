'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Review = {
  id: string;
  display_name: string;
  rating: number;
  body: string;
  menu_label: string;
  salon_label: string;
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  display_name: string;
  rating: number;
  body: string;
  menu_label: string;
  salon_label: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: EditForm = {
  display_name: '',
  rating: 5,
  body: '',
  menu_label: '',
  salon_label: '',
  sort_order: 0,
  is_active: true,
};

function toEditForm(r: Review): EditForm {
  return {
    display_name: r.display_name,
    rating: r.rating,
    body: r.body,
    menu_label: r.menu_label,
    salon_label: r.salon_label,
    sort_order: r.sort_order,
    is_active: r.is_active,
  };
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
  value: string | number;
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={base + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className={base}
        />
      )}
    </div>
  );
}

type FormFieldsOnChange = <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;

function FormFields({ f, onChange }: { f: EditForm; onChange: FormFieldsOnChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">口コミ内容</p>
        <div className="space-y-3">
          <Field
            label="表示名"
            value={f.display_name}
            onChange={(v) => onChange('display_name', v)}
            placeholder="M.K さん"
            required
          />
          <div className="w-32">
            <Field
              label="評価 (1〜5)"
              value={f.rating}
              onChange={(v) => onChange('rating', Number(v))}
              placeholder="5"
              type="number"
            />
          </div>
          <Field
            label="口コミ本文"
            value={f.body}
            onChange={(v) => onChange('body', v)}
            placeholder="施術の感想をご入力ください"
            required
            rows={4}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">来店情報</p>
        <div className="space-y-3">
          <Field
            label="来店店舗（任意）"
            value={f.salon_label}
            onChange={(v) => onChange('salon_label', v)}
            placeholder="AHNKISM labo"
          />
          <Field
            label="施術メニュー（任意）"
            value={f.menu_label}
            onChange={(v) => onChange('menu_label', v)}
            placeholder="髪質改善トリートメント"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
        <div className="space-y-3">
          <div className="w-40">
            <Field
              label="表示順 (sort_order)"
              value={f.sort_order}
              onChange={(v) => onChange('sort_order', Number(v))}
              placeholder="0"
              type="number"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_active_field"
              type="checkbox"
              checked={f.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
              className="rounded border-stone-300"
            />
            <label htmlFor="is_active_field" className="text-xs text-stone-600">
              公開する（チェックを外すと非表示）
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>({ ...EMPTY_FORM });
  const [savingNew, setSavingNew] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('home_reviews')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setReviews(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = (r: Review) => {
    setIsAddingNew(false);
    setEditingId(r.id);
    setForm(toEditForm(r));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveEdit = async (reviewId: string) => {
    if (!supabase || !form) return;
    if (!form.display_name.trim()) { showMessage('表示名は必須です'); return; }
    if (!form.body.trim()) { showMessage('口コミ本文は必須です'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('home_reviews')
      .update({
        display_name: form.display_name,
        rating: form.rating,
        body: form.body,
        menu_label: form.menu_label,
        salon_label: form.salon_label,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', reviewId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const openAddNew = () => {
    cancelEdit();
    const maxSort = reviews.length > 0 ? Math.max(...reviews.map((r) => r.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_FORM, sort_order: maxSort });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewForm({ ...EMPTY_FORM });
  };

  const addReview = async () => {
    if (!supabase) return;
    if (!newForm.display_name.trim()) { showMessage('表示名は必須です'); return; }
    if (!newForm.body.trim()) { showMessage('口コミ本文は必須です'); return; }
    setSavingNew(true);
    const { error } = await supabase
      .from('home_reviews')
      .insert({
        display_name: newForm.display_name,
        rating: newForm.rating,
        body: newForm.body,
        menu_label: newForm.menu_label,
        salon_label: newForm.salon_label,
        sort_order: newForm.sort_order,
        is_active: newForm.is_active,
      });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newForm.display_name}」の口コミを追加しました`);
    cancelAddNew();
    await loadData();
  };

  const toggleActive = async (r: Review) => {
    if (!supabase) return;
    await supabase.from('home_reviews').update({ is_active: !r.is_active }).eq('id', r.id);
    await loadData();
  };

  const deleteReview = async (r: Review) => {
    if (!supabase) return;
    if (!window.confirm(`「${r.display_name}」の口コミを削除しますか？この操作は取り消せません。`)) return;
    const { error } = await supabase.from('home_reviews').delete().eq('id', r.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${r.display_name}」の口コミを削除しました`);
    if (editingId === r.id) cancelEdit();
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">口コミ 管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          トップページ「口コミ」セクションの各項目を編集します。
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
          + 新規口コミを追加
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-800">新規口コミを追加</p>
          </div>
          <div className="border-t border-stone-100 px-5 py-5 space-y-5">
            <FormFields
              f={newForm}
              onChange={(key, value) => setNewForm((prev) => ({ ...prev, [key]: value }))}
            />
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={addReview}
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
      ) : reviews.length === 0 ? (
        <p className="text-xs text-stone-400">口コミがありません</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <section key={r.id} className="bg-white border border-stone-200 rounded-lg">

              {/* カードヘッダー */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    r.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {r.is_active ? '公開中' : '非表示中'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">{r.display_name}</p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      {'★'.repeat(Math.round(r.rating))}
                      {r.salon_label && `　${r.salon_label}`}
                      {`　sort: ${r.sort_order}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(r)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      r.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {r.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === r.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(r)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(r)}
                    disabled={!isConfigured}
                    className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 編集フォーム */}
              {editingId === r.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                  <FormFields f={form} onChange={setField} />

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(r.id)}
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
