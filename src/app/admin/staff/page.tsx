'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const MEDIA_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MEDIA_MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

const SALON_OPTIONS = [
  { value: 'labo',  label: 'AHNKISM labo' },
  { value: 'elu',   label: 'AHNKISM elu'  },
  { value: 'nit',   label: 'AHNKISM nit'  },
  { value: 'olea',  label: 'AHNKISM olea' },
];

function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'jpg / png / webp / gif のみアップロードできます';
  if (file.size > IMAGE_MAX_SIZE) return '画像のサイズは 5MB 以下にしてください';
  return null;
}

type Staff = {
  id: string;
  slug: string;
  name: string;
  name_kana: string | null;
  role: string | null;
  salon_slug: string | null;
  bio: string | null;
  specialties: string[] | null;
  recommended_menu: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  booking_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  name: string;
  name_kana: string;
  role: string;
  salon_slug: string;
  bio: string;
  specialties: string; // カンマ区切り文字列
  recommended_menu: string;
  instagram_url: string;
  tiktok_url: string;
  booking_url: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type NewForm = EditForm & { slug: string };

type StaffMedia = {
  id: string;
  staff_slug: string;
  media_url: string;
  media_type: 'image' | 'video';
  alt: string | null;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_EDIT_FORM: EditForm = {
  name: '',
  name_kana: '',
  role: '',
  salon_slug: '',
  bio: '',
  specialties: '',
  recommended_menu: '',
  instagram_url: '',
  tiktok_url: '',
  booking_url: '',
  image_url: null,
  sort_order: 1,
  is_active: true,
};

function toEditForm(s: Staff): EditForm {
  return {
    name: s.name,
    name_kana: s.name_kana ?? '',
    role: s.role ?? '',
    salon_slug: s.salon_slug ?? '',
    bio: s.bio ?? '',
    specialties: (s.specialties ?? []).join(', '),
    recommended_menu: s.recommended_menu ?? '',
    instagram_url: s.instagram_url ?? '',
    tiktok_url: s.tiktok_url ?? '',
    booking_url: s.booking_url ?? '',
    image_url: s.image_url,
    sort_order: s.sort_order,
    is_active: s.is_active,
  };
}

function toSpecialtiesArray(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
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
      {/* 基本情報 */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="スタッフ名" value={f.name} onChange={(v) => onChange('name', v)} placeholder="山田 葵" required />
          <Field label="よみがな" value={f.name_kana} onChange={(v) => onChange('name_kana', v)} placeholder="やまだ あおい" />
          <Field label="役職" value={f.role} onChange={(v) => onChange('role', v)} placeholder="トップスタイリスト" />
          <div>
            <label className="block text-[10px] tracking-widest text-stone-500 mb-1">所属店舗</label>
            <select
              value={f.salon_slug}
              onChange={(e) => onChange('salon_slug', e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
            >
              <option value="">未設定</option>
              {SALON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* プロフィール */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">プロフィール</p>
        <div className="space-y-3">
          <Field label="自己紹介文" value={f.bio} onChange={(v) => onChange('bio', v)} placeholder="髪質改善・縮毛矯正を得意とするスタイリスト..." rows={3} />
          <Field label="専門技術（カンマ区切り）" value={f.specialties} onChange={(v) => onChange('specialties', v)} placeholder="髪質改善, 縮毛矯正, カラー" />
          <Field label="おすすめメニュー" value={f.recommended_menu} onChange={(v) => onChange('recommended_menu', v)} placeholder="髪質改善トリートメント" />
        </div>
      </div>

      {/* SNS・予約 */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">SNS・予約</p>
        <div className="space-y-3">
          <Field label="Instagram URL" value={f.instagram_url} onChange={(v) => onChange('instagram_url', v)} placeholder="https://www.instagram.com/..." />
          <Field label="TikTok URL" value={f.tiktok_url} onChange={(v) => onChange('tiktok_url', v)} placeholder="https://www.tiktok.com/@..." />
          <Field label="予約ボタン URL (booking_url)" value={f.booking_url} onChange={(v) => onChange('booking_url', v)} placeholder="https://beauty.hotpepper.jp/..." />
        </div>
      </div>

      {/* 表示設定 */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
        <div className="space-y-3">
          <div className="w-40">
            <Field label="表示順 (sort_order)" value={f.sort_order} onChange={(v) => onChange('sort_order', Number(v))} placeholder="1" type="number" />
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

export default function AdminStaffPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<NewForm>({ ...EMPTY_EDIT_FORM, slug: '' });
  const [savingNew, setSavingNew] = useState(false);
  const profileImageFileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const [staffMedia, setStaffMedia] = useState<StaffMedia[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setStaff(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadMedia = useCallback(async (slug: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('staff_media')
      .select('id, staff_slug, media_url, media_type, alt, sort_order, is_active')
      .eq('staff_slug', slug)
      .order('sort_order', { ascending: true });
    setStaffMedia(data ?? []);
  }, [supabase]);

  const startEdit = (s: Staff) => {
    setIsAddingNew(false);
    setEditingId(s.id);
    setForm(toEditForm(s));
    loadMedia(s.slug);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
    setStaffMedia([]);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setNewField = <K extends keyof NewForm>(key: K, value: NewForm[K]) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveEdit = async (staffId: string) => {
    if (!supabase || !form) return;
    if (!form.name.trim()) { showMessage('スタッフ名は必須です'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('staff')
      .update({
        name: form.name,
        name_kana: form.name_kana || null,
        role: form.role || null,
        salon_slug: form.salon_slug || null,
        bio: form.bio || null,
        specialties: toSpecialtiesArray(form.specialties),
        recommended_menu: form.recommended_menu || null,
        instagram_url: form.instagram_url || null,
        tiktok_url: form.tiktok_url || null,
        booking_url: form.booking_url || null,
        image_url: form.image_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', staffId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const openAddNew = () => {
    cancelEdit();
    const maxSort = staff.length > 0 ? Math.max(...staff.map((s) => s.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_EDIT_FORM, slug: '', sort_order: maxSort });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewForm({ ...EMPTY_EDIT_FORM, slug: '' });
  };

  const addStaff = async () => {
    if (!supabase) return;
    const slug = newForm.slug.trim();
    if (!slug) { showMessage('slug は必須です'); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { showMessage('slug は英小文字・数字・ハイフンのみ使用できます'); return; }
    if (!newForm.name.trim()) { showMessage('スタッフ名は必須です'); return; }
    if (staff.some((s) => s.slug === slug)) { showMessage('その slug はすでに使われています'); return; }

    setSavingNew(true);
    const { error } = await supabase
      .from('staff')
      .insert({
        slug,
        name: newForm.name,
        name_kana: newForm.name_kana || null,
        role: newForm.role || null,
        salon_slug: newForm.salon_slug || null,
        bio: newForm.bio || null,
        specialties: toSpecialtiesArray(newForm.specialties),
        recommended_menu: newForm.recommended_menu || null,
        instagram_url: newForm.instagram_url || null,
        tiktok_url: newForm.tiktok_url || null,
        booking_url: newForm.booking_url || null,
        sort_order: newForm.sort_order,
        is_active: newForm.is_active,
      });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`${newForm.name} を追加しました`);
    cancelAddNew();
    await loadData();
  };

  const toggleActive = async (s: Staff) => {
    if (!supabase) return;
    await supabase.from('staff').update({ is_active: !s.is_active }).eq('id', s.id);
    await loadData();
  };

  const deleteStaff = async (s: Staff) => {
    if (!supabase) return;
    if (!window.confirm(`「${s.name}」を削除しますか？この操作は取り消せません。`)) return;

    // staff_media レコードを先に削除（Storage は施術ギャラリー工程で対応）
    await supabase.from('staff_media').delete().eq('staff_slug', s.slug);

    // プロフィール画像を Storage から削除
    if (s.image_url) {
      const path = extractStoragePath(s.image_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase.from('staff').delete().eq('id', s.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`${s.name} を削除しました`);
    if (editingId === s.id) cancelEdit();
    await loadData();
  };

  const uploadProfileImage = async (file: File, s: Staff) => {
    if (!supabase) return;
    const err = validateImageFile(file);
    if (err) { showMessage(err); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `staff/${s.slug}/profile-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // 古い画像を Storage から削除
      if (s.image_url) {
        const oldPath = extractStoragePath(s.image_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const { error: dbErr } = await supabase
        .from('staff')
        .update({ image_url: publicUrl })
        .eq('id', s.id);
      if (dbErr) { showMessage(`DB 保存失敗: ${dbErr.message}`); return; }

      setField('image_url', publicUrl);
      showMessage('プロフィール画像をアップロードしました');
      await loadData();
    } finally {
      setUploading(false);
      if (profileImageFileRef.current) profileImageFileRef.current.value = '';
    }
  };

  const uploadMedia = async (file: File, staffSlug: string) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = MEDIA_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) { showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます'); return; }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > MEDIA_MAX_VIDEO_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }
    if (staffMedia.length >= 4) { showMessage('施術ギャラリーは最大4件です'); return; }

    setMediaUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `staff-media/${staffSlug}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const maxSort = staffMedia.length > 0 ? Math.max(...staffMedia.map((m) => m.sort_order)) + 1 : 1;

      const { error: dbErr } = await supabase.from('staff_media').insert({
        staff_slug: staffSlug,
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
        sort_order: maxSort,
        is_active: true,
      });
      if (dbErr) { showMessage(`DB 保存失敗: ${dbErr.message}`); return; }

      showMessage('メディアをアップロードしました');
      await loadMedia(staffSlug);
    } finally {
      setMediaUploading(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const deleteMedia = async (media: StaffMedia, staffSlug: string) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    const path = extractStoragePath(media.media_url);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    const { error } = await supabase.from('staff_media').delete().eq('id', media.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    setStaffMedia((prev) => prev.filter((m) => m.id !== media.id));
    await loadMedia(staffSlug);
  };

  const toggleMediaActive = async (media: StaffMedia) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('staff_media')
      .update({ is_active: !media.is_active })
      .eq('id', media.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    setStaffMedia((prev) => prev.map((m) => m.id === media.id ? { ...m, is_active: !m.is_active } : m));
  };

  const updateMediaSort = async (media: StaffMedia, sortOrder: number) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('staff_media')
      .update({ sort_order: sortOrder })
      .eq('id', media.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    setStaffMedia((prev) => prev.map((m) => m.id === media.id ? { ...m, sort_order: sortOrder } : m));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">スタッフ管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          スタッフ情報を編集します。slug はURLに影響するため変更できません。
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
          + 新規スタッフを追加
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-800">新規スタッフを追加</p>
          </div>
          <div className="border-t border-stone-100 px-5 py-5 space-y-5">
            {/* slug */}
            <div>
              <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">URL識別子</p>
              <Field
                label="slug"
                value={newForm.slug}
                onChange={(v) => setNewField('slug', v)}
                placeholder="yamada-aoi"
                required
              />
              <p className="text-[10px] text-stone-400 mt-1">英小文字・数字・ハイフンのみ使用可。追加後は変更不可。</p>
            </div>

            <FormFields
              f={newForm}
              onChange={(key, value) => setNewField(key, value as NewForm[typeof key])}
            />

            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={addStaff}
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

      {/* スタッフ一覧 */}
      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : staff.length === 0 ? (
        <p className="text-xs text-stone-400">スタッフデータがありません</p>
      ) : (
        <div className="space-y-4">
          {staff.map((s) => (
            <section key={s.id} className="bg-white border border-stone-200 rounded-lg">

              {/* カードヘッダー */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    s.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {s.is_active ? '公開中' : '非表示中'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">{s.name}</p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      slug: <span className="font-mono">{s.slug}</span>
                      　sort: {s.sort_order}
                      {s.salon_slug && `　${s.salon_slug}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(s)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      s.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {s.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === s.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      ✕ 閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(s)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                  <button
                    onClick={() => deleteStaff(s)}
                    disabled={!isConfigured}
                    className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 編集フォーム */}
              {editingId === s.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-5">

                  {/* slug（読み取り専用） */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">URL識別子</p>
                    <div>
                      <label className="block text-[10px] tracking-widest text-stone-500 mb-1">slug（変更不可）</label>
                      <p className="text-xs font-mono text-stone-600 bg-stone-50 border border-stone-200 rounded px-3 py-1.5">
                        {s.slug}
                      </p>
                    </div>
                  </div>

                  <FormFields f={form} onChange={setField} />

                  {/* プロフィール画像 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">プロフィール画像</p>
                    <div className="w-20 h-20 rounded-full bg-stone-100 overflow-hidden relative mb-2">
                      {form.image_url ? (
                        <Image
                          src={form.image_url}
                          alt={form.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-[10px] text-stone-400 tracking-widest">PHOTO</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={profileImageFileRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      className="hidden"
                      disabled={!isConfigured || uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadProfileImage(file, s);
                      }}
                    />
                    <button
                      onClick={() => profileImageFileRef.current?.click()}
                      disabled={!isConfigured || uploading}
                      className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                    >
                      {uploading ? 'アップロード中...' : form.image_url ? '画像を差し替え' : '画像をアップロード'}
                    </button>
                    <p className="text-[10px] text-stone-400 mt-1">jpg / png / webp / gif・5MB 以下</p>
                  </div>

                  {/* 施術ギャラリー */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">施術ギャラリー（最大4件）</p>
                    <div className="space-y-2 mb-3">
                      {staffMedia.map((media) => (
                        <div key={media.id} className="flex items-center gap-3 border border-stone-200 rounded p-2">
                          <div className="w-16 h-16 bg-stone-100 rounded overflow-hidden shrink-0 relative">
                            {media.media_type === 'video' ? (
                              <video src={media.media_url} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <Image src={media.media_url} alt={media.alt ?? ''} fill className="object-cover" unoptimized />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-stone-400 uppercase mb-1">{media.media_type}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-400">sort:</span>
                              <input
                                type="number"
                                defaultValue={media.sort_order}
                                className="w-14 border border-stone-200 rounded px-1 py-0.5 text-[10px] text-stone-700 bg-white"
                                onBlur={(e) => updateMediaSort(media, Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleMediaActive(media)}
                              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                media.is_active
                                  ? 'border-green-400 text-green-600 hover:bg-green-50'
                                  : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                              }`}
                            >
                              {media.is_active ? '表示中' : '非表示'}
                            </button>
                            <button
                              onClick={() => deleteMedia(media, s.slug)}
                              className="text-[10px] px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      ))}
                      {staffMedia.length === 0 && (
                        <p className="text-[10px] text-stone-400">メディアがまだありません</p>
                      )}
                    </div>
                    {staffMedia.length < 4 && (
                      <>
                        <input
                          ref={mediaFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                          className="hidden"
                          disabled={!isConfigured || mediaUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadMedia(file, s.slug);
                          }}
                        />
                        <button
                          onClick={() => mediaFileRef.current?.click()}
                          disabled={!isConfigured || mediaUploading}
                          className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                        >
                          {mediaUploading ? 'アップロード中...' : '+ メディアを追加'}
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1">
                          jpg / png / webp / gif（5MB以下）、mp4 / mov / webm（50MB以下）
                        </p>
                      </>
                    )}
                  </div>

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(s.id)}
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
