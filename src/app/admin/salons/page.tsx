'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

function extractStoragePath(imageUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'jpg / png / webp / gif のみアップロードできます';
  if (file.size > IMAGE_MAX_SIZE) return '画像のサイズは 5MB 以下にしてください';
  return null;
}

type Salon = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string | null;
  address: string | null;
  address_postal: string | null;
  address_locality: string | null;
  tel: string | null;
  hours: string | null;
  hours_note: string | null;
  nearest_station: string | null;
  latitude: number | null;
  longitude: number | null;
  google_map_url: string | null;
  hotpepper_url: string | null;
  instagram_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type EditForm = Omit<Salon, 'id' | 'slug'>;

function toEditForm(salon: Salon): EditForm {
  return {
    name: salon.name,
    short_name: salon.short_name,
    description: salon.description,
    address: salon.address,
    address_postal: salon.address_postal,
    address_locality: salon.address_locality,
    tel: salon.tel,
    hours: salon.hours,
    hours_note: salon.hours_note,
    nearest_station: salon.nearest_station,
    latitude: salon.latitude,
    longitude: salon.longitude,
    google_map_url: salon.google_map_url,
    hotpepper_url: salon.hotpepper_url,
    instagram_url: salon.instagram_url,
    image_url: salon.image_url,
    sort_order: salon.sort_order,
    is_active: salon.is_active,
  };
}

// テキスト入力フィールド
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
    'w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white disabled:bg-stone-50';

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

export default function AdminSalonsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const salonImageFileRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setSalons(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = (salon: Salon) => {
    setEditingId(salon.id);
    setForm(toEditForm(salon));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const saveEdit = async (salonId: string) => {
    if (!supabase || !form) return;
    setSaving(true);
    const { error } = await supabase
      .from('salons')
      .update({
        name: form.name,
        short_name: form.short_name,
        description: form.description || null,
        address: form.address || null,
        address_postal: form.address_postal || null,
        address_locality: form.address_locality || null,
        tel: form.tel || null,
        hours: form.hours || null,
        hours_note: form.hours_note || null,
        nearest_station: form.nearest_station || null,
        latitude: form.latitude,
        longitude: form.longitude,
        google_map_url: form.google_map_url || null,
        hotpepper_url: form.hotpepper_url || null,
        instagram_url: form.instagram_url || null,
        image_url: form.image_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', salonId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const uploadSalonImage = async (file: File, salon: Salon) => {
    if (!supabase) return;
    const err = validateImageFile(file);
    if (err) { showMessage(err); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${salon.slug}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // 古い画像を Storage から削除
      if (salon.image_url) {
        const oldPath = extractStoragePath(salon.image_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const { error: dbErr } = await supabase
        .from('salons')
        .update({ image_url: publicUrl })
        .eq('id', salon.id);
      if (dbErr) { showMessage(`DB 保存失敗: ${dbErr.message}`); return; }

      setField('image_url', publicUrl);
      showMessage('店舗画像をアップロードしました');
      await loadData();
    } finally {
      setUploading(false);
      if (salonImageFileRef.current) salonImageFileRef.current.value = '';
    }
  };

  const toggleActive = async (salon: Salon) => {
    if (!supabase) return;
    await supabase
      .from('salons')
      .update({ is_active: !salon.is_active })
      .eq('id', salon.id);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">店舗管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          店舗情報を編集します。slug はURLに影響するため変更できません。
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

      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : salons.length === 0 ? (
        <p className="text-xs text-stone-400">店舗データがありません</p>
      ) : (
        <div className="space-y-4">
          {salons.map(salon => (
            <section key={salon.id} className="bg-white border border-stone-200 rounded-lg">

              {/* ── カードヘッダー ── */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {/* 公開バッジ */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    salon.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {salon.is_active ? '公開中' : '非表示中'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">
                      {salon.name}
                    </p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      slug: <span className="font-mono">{salon.slug}</span>
                      　sort: {salon.sort_order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(salon)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      salon.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {salon.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === salon.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      ✕ 閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(salon)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>

              {/* ── 編集フォーム ── */}
              {editingId === salon.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-5">

                  {/* 基本情報 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="店舗名"
                        value={form.name}
                        onChange={v => setField('name', v)}
                        placeholder="AHNKISM labo"
                        required
                      />
                      <Field
                        label="短縮名"
                        value={form.short_name}
                        onChange={v => setField('short_name', v)}
                        placeholder="labo"
                        required
                      />
                    </div>
                    <div className="mt-3">
                      <Field
                        label="説明文"
                        value={form.description}
                        onChange={v => setField('description', v)}
                        placeholder="店舗の説明..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* 住所・連絡先 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">住所・連絡先</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="郵便番号"
                        value={form.address_postal}
                        onChange={v => setField('address_postal', v)}
                        placeholder="550-0015"
                      />
                      <Field
                        label="市区町村"
                        value={form.address_locality}
                        onChange={v => setField('address_locality', v)}
                        placeholder="大阪市西区"
                      />
                    </div>
                    <div className="mt-3">
                      <Field
                        label="住所"
                        value={form.address}
                        onChange={v => setField('address', v)}
                        placeholder="大阪府大阪市西区南堀江..."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <Field
                        label="電話番号"
                        value={form.tel}
                        onChange={v => setField('tel', v)}
                        placeholder="06-xxxx-xxxx"
                      />
                      <Field
                        label="最寄駅"
                        value={form.nearest_station}
                        onChange={v => setField('nearest_station', v)}
                        placeholder="西大橋駅 徒歩3分"
                      />
                    </div>
                  </div>

                  {/* 営業時間 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">営業時間</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="営業時間"
                        value={form.hours}
                        onChange={v => setField('hours', v)}
                        placeholder="10:00〜20:00"
                      />
                      <Field
                        label="備考（定休日など）"
                        value={form.hours_note}
                        onChange={v => setField('hours_note', v)}
                        placeholder="火曜定休"
                      />
                    </div>
                  </div>

                  {/* 外部URL */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">外部URL</p>
                    <div className="space-y-3">
                      <Field
                        label="Google Map URL"
                        value={form.google_map_url}
                        onChange={v => setField('google_map_url', v)}
                        placeholder="https://maps.google.com/..."
                      />
                      <Field
                        label="Hotpepper URL"
                        value={form.hotpepper_url}
                        onChange={v => setField('hotpepper_url', v)}
                        placeholder="https://beauty.hotpepper.jp/..."
                      />
                      <Field
                        label="Instagram URL"
                        value={form.instagram_url}
                        onChange={v => setField('instagram_url', v)}
                        placeholder="https://www.instagram.com/..."
                      />
                    </div>
                  </div>

                  {/* 画像・座標・表示設定 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">画像・座標・表示設定</p>
                    <div className="space-y-3">
                      {/* 店舗画像アップロード */}
                      <div>
                        <p className="text-[10px] tracking-widest text-stone-500 mb-1.5">店舗画像</p>
                        <div className="relative aspect-[16/9] w-48 bg-stone-100 overflow-hidden rounded mb-2">
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
                              <span className="text-[10px] text-stone-400 tracking-widest">IMAGE</span>
                            </div>
                          )}
                        </div>
                        <input
                          ref={salonImageFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          className="hidden"
                          disabled={!isConfigured || uploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadSalonImage(file, salon);
                          }}
                        />
                        <button
                          onClick={() => salonImageFileRef.current?.click()}
                          disabled={!isConfigured || uploading}
                          className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                        >
                          {uploading ? 'アップロード中...' : form.image_url ? '画像を差し替え' : '画像をアップロード'}
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1">jpg / png / webp / gif・5MB 以下</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field
                          label="緯度 (latitude)"
                          value={form.latitude}
                          onChange={v => setField('latitude', v === '' ? null : Number(v))}
                          placeholder="34.678"
                          type="number"
                        />
                        <Field
                          label="経度 (longitude)"
                          value={form.longitude}
                          onChange={v => setField('longitude', v === '' ? null : Number(v))}
                          placeholder="135.499"
                          type="number"
                        />
                        <Field
                          label="表示順 (sort_order)"
                          value={form.sort_order}
                          onChange={v => setField('sort_order', Number(v))}
                          placeholder="1"
                          type="number"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id={`active-${salon.id}`}
                          type="checkbox"
                          checked={form.is_active}
                          onChange={e => setField('is_active', e.target.checked)}
                          className="rounded border-stone-300"
                        />
                        <label htmlFor={`active-${salon.id}`} className="text-xs text-stone-600">
                          公開する（チェックを外すと非表示）
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(salon.id)}
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
