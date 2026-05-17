'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Requirement = { label: string; value: string };

type Job = {
  id: string;
  slug: string;
  title: string;
  role_label: string;
  description: string;
  requirements: Requirement[];
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  slug: string;
  title: string;
  role_label: string;
  description: string;
  requirements: Requirement[];
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: EditForm = {
  slug: '',
  title: '',
  role_label: '',
  description: '',
  requirements: [],
  sort_order: 0,
  is_active: true,
};

function toEditForm(j: Job): EditForm {
  return {
    slug: j.slug,
    title: j.title,
    role_label: j.role_label,
    description: j.description,
    requirements: j.requirements,
    sort_order: j.sort_order,
    is_active: j.is_active,
  };
}

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
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
}) {
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
          className={inputBase + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className={inputBase}
        />
      )}
    </div>
  );
}

function RequirementsEditor({
  requirements,
  onChange,
}: {
  requirements: Requirement[];
  onChange: (reqs: Requirement[]) => void;
}) {
  const add = () => onChange([...requirements, { label: '', value: '' }]);
  const remove = (i: number) => onChange(requirements.filter((_, idx) => idx !== i));
  const update = (i: number, key: 'label' | 'value', val: string) => {
    onChange(requirements.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  };

  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">
        募集要項
      </label>
      <div className="space-y-2 mb-2">
        {requirements.length === 0 && (
          <p className="text-[10px] text-stone-400">項目がありません。「+ 項目を追加」で追加してください。</p>
        )}
        {requirements.map((req, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              value={req.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="項目名（例: 給与）"
              className="w-28 border border-stone-300 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white shrink-0"
            />
            <input
              value={req.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="内容（例: 月給25万円〜）"
              className="flex-1 border border-stone-300 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 text-[10px] px-2 py-1.5 border border-red-300 text-red-400 hover:bg-red-50 rounded transition-colors"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-[10px] px-3 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors"
      >
        + 項目を追加
      </button>
    </div>
  );
}

type FormFieldsOnChange = <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;

function FormFields({ f, onChange }: { f: EditForm; onChange: FormFieldsOnChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">職種情報</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="タイトル"
              value={f.title}
              onChange={(v) => onChange('title', v)}
              placeholder="スタイリスト募集"
              required
            />
            <Field
              label="職種ラベル"
              value={f.role_label}
              onChange={(v) => onChange('role_label', v)}
              placeholder="スタイリスト"
            />
          </div>
          <Field
            label="スラッグ（URL用）"
            value={f.slug}
            onChange={(v) => onChange('slug', v)}
            placeholder="stylist"
            required
          />
          <Field
            label="説明文"
            value={f.description}
            onChange={(v) => onChange('description', v)}
            placeholder="職種の説明・アピールポイントを入力"
            rows={3}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">募集要項</p>
        <RequirementsEditor
          requirements={f.requirements}
          onChange={(reqs) => onChange('requirements', reqs)}
        />
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
              掲載する（チェックを外すと非表示）
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRecruitPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [jobs, setJobs] = useState<Job[]>([]);
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
      .from('recruit_jobs')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setJobs((data ?? []).map((j) => ({
        ...j,
        requirements: Array.isArray(j.requirements) ? j.requirements : [],
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = (j: Job) => {
    setIsAddingNew(false);
    setEditingId(j.id);
    setForm(toEditForm(j));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const validate = (f: EditForm): string | null => {
    if (!f.title.trim()) return 'タイトルは必須です';
    if (!f.slug.trim()) return 'スラッグは必須です';
    if (!/^[a-z0-9-]+$/.test(f.slug)) return 'スラッグは英小文字・数字・ハイフンのみ使用できます';
    return null;
  };

  const saveEdit = async (jobId: string) => {
    if (!supabase || !form) return;
    const err = validate(form);
    if (err) { showMessage(err); return; }
    setSaving(true);
    const { error } = await supabase
      .from('recruit_jobs')
      .update({
        slug: form.slug,
        title: form.title,
        role_label: form.role_label,
        description: form.description,
        requirements: form.requirements,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', jobId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const openAddNew = () => {
    cancelEdit();
    const maxSort = jobs.length > 0 ? Math.max(...jobs.map((j) => j.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_FORM, sort_order: maxSort });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewForm({ ...EMPTY_FORM });
  };

  const addJob = async () => {
    if (!supabase) return;
    const err = validate(newForm);
    if (err) { showMessage(err); return; }
    setSavingNew(true);
    const { error } = await supabase
      .from('recruit_jobs')
      .insert({
        slug: newForm.slug,
        title: newForm.title,
        role_label: newForm.role_label,
        description: newForm.description,
        requirements: newForm.requirements,
        sort_order: newForm.sort_order,
        is_active: newForm.is_active,
      });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newForm.title}」を追加しました`);
    cancelAddNew();
    await loadData();
  };

  const toggleActive = async (j: Job) => {
    if (!supabase) return;
    await supabase.from('recruit_jobs').update({ is_active: !j.is_active }).eq('id', j.id);
    await loadData();
  };

  const deleteJob = async (j: Job) => {
    if (!supabase) return;
    if (!window.confirm(`「${j.title}」を削除しますか？この操作は取り消せません。`)) return;
    const { error } = await supabase.from('recruit_jobs').delete().eq('id', j.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${j.title}」を削除しました`);
    if (editingId === j.id) cancelEdit();
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">採用情報 管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          採用ページに掲載する職種を管理します。スラッグが URL になります（例: stylist → /recruit/stylist）。
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
          + 新規職種を追加
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-800">新規職種を追加</p>
          </div>
          <div className="border-t border-stone-100 px-5 py-5 space-y-5">
            <FormFields
              f={newForm}
              onChange={(key, value) => setNewForm((prev) => ({ ...prev, [key]: value }))}
            />
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={addJob}
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
      ) : jobs.length === 0 ? (
        <p className="text-xs text-stone-400">職種がありません</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <section key={j.id} className="bg-white border border-stone-200 rounded-lg">

              {/* カードヘッダー */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    j.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {j.is_active ? '掲載中' : '非掲載'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">{j.title}</p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      /recruit/{j.slug}
                      {j.role_label && `　${j.role_label}`}
                      {`　sort: ${j.sort_order}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(j)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      j.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {j.is_active ? '掲載中' : '非掲載'}
                  </button>
                  {editingId === j.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(j)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                  <button
                    onClick={() => deleteJob(j)}
                    disabled={!isConfigured}
                    className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 編集フォーム */}
              {editingId === j.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                  <FormFields f={form} onChange={setField} />

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(j.id)}
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
