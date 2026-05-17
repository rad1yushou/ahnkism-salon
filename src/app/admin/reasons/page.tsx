'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const MEDIA_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MEDIA_MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

type Reason = {
  id: string;
  number_label: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  number_label: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: EditForm = {
  number_label: '',
  title: '',
  description: '',
  media_url: null,
  media_type: null,
  sort_order: 0,
  is_active: true,
};

function toEditForm(r: Reason): EditForm {
  return {
    number_label: r.number_label,
    title: r.title,
    description: r.description,
    media_url: r.media_url,
    media_type: r.media_type,
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
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={base + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
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
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">内容</p>
        <div className="space-y-3">
          <div className="w-32">
            <Field
              label="番号ラベル"
              value={f.number_label}
              onChange={(v) => onChange('number_label', v)}
              placeholder="01"
            />
          </div>
          <Field
            label="タイトル"
            value={f.title}
            onChange={(v) => onChange('title', v)}
            placeholder="髪質改善の専門技術"
            required
          />
          <Field
            label="説明文"
            value={f.description}
            onChange={(v) => onChange('description', v)}
            placeholder="説明文を入力..."
            rows={3}
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

export default function AdminReasonsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>({ ...EMPTY_FORM });
  const [savingNew, setSavingNew] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('home_reasons')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setReasons(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = (r: Reason) => {
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

  const saveEdit = async (reasonId: string) => {
    if (!supabase || !form) return;
    if (!form.title.trim()) { showMessage('タイトルは必須です'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('home_reasons')
      .update({
        number_label: form.number_label,
        title: form.title,
        description: form.description,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', reasonId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const openAddNew = () => {
    cancelEdit();
    const maxSort = reasons.length > 0 ? Math.max(...reasons.map((r) => r.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_FORM, sort_order: maxSort });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewForm({ ...EMPTY_FORM });
  };

  const addReason = async () => {
    if (!supabase) return;
    if (!newForm.title.trim()) { showMessage('タイトルは必須です'); return; }
    setSavingNew(true);
    const { error } = await supabase
      .from('home_reasons')
      .insert({
        number_label: newForm.number_label,
        title: newForm.title,
        description: newForm.description,
        sort_order: newForm.sort_order,
        is_active: newForm.is_active,
      });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newForm.title}」を追加しました`);
    cancelAddNew();
    await loadData();
  };

  const toggleActive = async (r: Reason) => {
    if (!supabase) return;
    await supabase.from('home_reasons').update({ is_active: !r.is_active }).eq('id', r.id);
    await loadData();
  };

  const deleteReason = async (r: Reason) => {
    if (!supabase) return;
    if (!window.confirm(`「${r.title}」を削除しますか？この操作は取り消せません。`)) return;
    if (r.media_url) {
      const path = extractStoragePath(r.media_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase.from('home_reasons').delete().eq('id', r.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${r.title}」を削除しました`);
    if (editingId === r.id) cancelEdit();
    await loadData();
  };

  const uploadMedia = async (file: File, reason: Reason) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = MEDIA_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) { showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます'); return; }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > MEDIA_MAX_VIDEO_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `reasons/${reason.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // 既存メディアを削除
      if (reason.media_url) {
        const oldPath = extractStoragePath(reason.media_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const { error: dbErr } = await supabase
        .from('home_reasons')
        .update({ media_url: publicUrl, media_type: mediaType })
        .eq('id', reason.id);
      if (dbErr) { showMessage(`DB 保存失敗: ${dbErr.message}`); return; }

      setField('media_url', publicUrl);
      setField('media_type', mediaType);
      showMessage('メディアをアップロードしました');
      await loadData();
    } finally {
      setUploading(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const deleteMedia = async (reason: Reason) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    if (reason.media_url) {
      const path = extractStoragePath(reason.media_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase
      .from('home_reasons')
      .update({ media_url: null, media_type: null })
      .eq('id', reason.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    setField('media_url', null);
    setField('media_type', null);
    showMessage('メディアを削除しました');
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">選ばれる理由 管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          トップページ「選ばれる理由」セクションの各項目を編集します。
        </p>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          ⚠️ Supabase の環境変数が設定されていません。
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
          + 新規項目を追加
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-800">新規項目を追加</p>
          </div>
          <div className="border-t border-stone-100 px-5 py-5 space-y-5">
            <FormFields
              f={newForm}
              onChange={(key, value) => setNewForm((prev) => ({ ...prev, [key]: value }))}
            />
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={addReason}
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
      ) : reasons.length === 0 ? (
        <p className="text-xs text-stone-400">項目がありません</p>
      ) : (
        <div className="space-y-4">
          {reasons.map((r) => (
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
                    <p className="text-sm font-medium text-stone-800 tracking-wide">
                      {r.number_label && (
                        <span className="text-stone-400 mr-2 font-light">{r.number_label}</span>
                      )}
                      {r.title}
                    </p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      sort: {r.sort_order}
                      {r.media_type && `　${r.media_type}`}
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
                      ✕ 閉じる
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
                    onClick={() => deleteReason(r)}
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

                  {/* メディア */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">画像 / 動画</p>
                    {form.media_url && (
                      <div className="mb-3">
                        <div className="w-48 aspect-video bg-stone-100 rounded overflow-hidden relative mb-2">
                          {form.media_type === 'video' ? (
                            <video
                              src={form.media_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <Image
                              src={form.media_url}
                              alt={form.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        <button
                          onClick={() => deleteMedia(r)}
                          disabled={!isConfigured || uploading}
                          className="text-[10px] py-1 px-2 border border-red-300 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                        >
                          メディアを削除
                        </button>
                      </div>
                    )}
                    <input
                      ref={mediaFileRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                      className="hidden"
                      disabled={!isConfigured || uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMedia(file, r);
                      }}
                    />
                    <button
                      onClick={() => mediaFileRef.current?.click()}
                      disabled={!isConfigured || uploading}
                      className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                    >
                      {uploading ? 'アップロード中...' : form.media_url ? 'メディアを差し替え' : 'メディアをアップロード'}
                    </button>
                    <p className="text-[10px] text-stone-400 mt-1">
                      jpg / png / webp / gif（5MB以下）、mp4 / mov / webm（50MB以下）
                    </p>
                  </div>

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
