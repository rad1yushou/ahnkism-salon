'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function getAspectClass(aspect: string | null): string {
  if (aspect === 'portrait') return 'aspect-[4/5]';
  if (aspect === 'square') return 'aspect-square';
  if (aspect === 'vertical') return 'aspect-[9/16]';
  return 'aspect-video';
}

function getPositionClass(position: string | null): string {
  if (position === 'top') return 'object-top';
  if (position === 'bottom') return 'object-bottom';
  if (position === 'left') return 'object-left';
  if (position === 'right') return 'object-right';
  return 'object-center';
}

type AboutData = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  is_active: boolean;
};

type Form = {
  body: string;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  is_active: boolean;
};

export default function AdminAboutPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [data, setData] = useState<AboutData | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data: row, error } = await supabase
      .from('about_page')
      .select('id, body, media_url, media_type, media_aspect, media_position, is_active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLoading(false);
    if (error) { showMessage(`読み込み失敗: ${error.message}`); return; }
    if (!row) { setNotFound(true); return; }
    const d: AboutData = {
      id: row.id,
      body: row.body ?? '',
      media_url: row.media_url ?? null,
      media_type: (row.media_type ?? null) as 'image' | 'video' | null,
      media_aspect: (row.media_aspect ?? 'video') as AboutData['media_aspect'],
      media_position: (row.media_position ?? 'center') as AboutData['media_position'],
      is_active: row.is_active ?? true,
    };
    setData(d);
    setNotFound(false);
    setForm({
      body: d.body,
      media_aspect: d.media_aspect,
      media_position: d.media_position,
      is_active: d.is_active,
    });
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const save = async () => {
    if (!supabase || !data || !form) return;
    setSaving(true);
    const { error } = await supabase
      .from('about_page')
      .update({
        body: form.body,
        media_aspect: form.media_aspect,
        media_position: form.media_position,
        is_active: form.is_active,
      })
      .eq('id', data.id);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    await loadData();
  };

  const uploadMedia = async (file: File) => {
    if (!supabase || !data) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます');
      return;
    }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > VIDEO_MAX_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `about/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (data.media_url) {
        const oldPath = extractStoragePath(data.media_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const { error: dbErr } = await supabase
        .from('about_page')
        .update({ media_url: publicUrl, media_type: mediaType })
        .eq('id', data.id);
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      showMessage('メディアをアップロードしました');
      await loadData();
    } finally {
      setUploading(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const deleteMedia = async () => {
    if (!supabase || !data) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    if (data.media_url) {
      const oldPath = extractStoragePath(data.media_url);
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    const { error } = await supabase
      .from('about_page')
      .update({ media_url: null, media_type: null })
      .eq('id', data.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage('メディアを削除しました');
    await loadData();
  };

  if (!isConfigured) {
    return (
      <div className="text-xs text-stone-400 tracking-wider">
        Supabase が設定されていません
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-1">Admin</p>
        <h1 className="text-xl font-light tracking-wider text-stone-800">グループ紹介</h1>
        <p className="text-xs text-stone-400 mt-1">/about ページの本文・画像/動画を管理します</p>
      </div>

      {message && (
        <div className="mb-6 px-4 py-2 bg-stone-100 text-xs text-stone-600 tracking-wider">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-stone-400 tracking-wider">読み込み中...</p>
      ) : notFound ? (
        <div className="border border-red-200 p-6 text-xs text-red-500 leading-relaxed">
          <p className="font-medium mb-2">レコードが見つかりません</p>
          <p>supabase/027_about_page.sql が正しく実行されているか確認してください。</p>
        </div>
      ) : !form || !data ? null : (
        <div className="space-y-8">

          {/* 公開設定 */}
          <div className="border border-stone-200 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setField('is_active', e.target.checked)}
                className="accent-stone-600"
              />
              <span className="text-xs text-stone-600 tracking-wider">公開する</span>
            </label>
            <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
              オフにするとフォールバック文言が表示されます
            </p>
          </div>

          {/* 本文 */}
          <div className="border border-stone-200 p-6">
            <label className="block text-[10px] tracking-widest text-stone-500 mb-3">
              本文
            </label>
            <textarea
              value={form.body}
              onChange={e => setField('body', e.target.value)}
              rows={8}
              className="w-full text-xs text-stone-700 border border-stone-200 p-3 leading-relaxed resize-y focus:outline-none focus:border-stone-400"
              placeholder="本文を入力してください（改行で段落を分けられます）"
            />
            <p className="text-[10px] text-stone-400 mt-2">改行で段落に分かれます</p>
          </div>

          {/* メディア */}
          <div className="border border-stone-200 p-6">
            <p className="text-[10px] tracking-widest text-stone-500 mb-4">画像 / 動画</p>

            {/* プレビュー（form の比率・位置を即時反映） */}
            {data.media_url && (
              <div className="mb-4">
                <div className={`${getAspectClass(form.media_aspect)} bg-stone-100 overflow-hidden relative w-full`}>
                  {data.media_type === 'video' ? (
                    <video
                      src={data.media_url}
                      className={`absolute inset-0 w-full h-full object-cover ${getPositionClass(form.media_position)}`}
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={data.media_url}
                      alt="グループ紹介メディア"
                      fill
                      className={`object-cover ${getPositionClass(form.media_position)}`}
                      unoptimized
                    />
                  )}
                </div>
                <p className="text-[10px] text-stone-400 mt-1 truncate">{data.media_url}</p>
              </div>
            )}

            <input
              ref={mediaFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadMedia(file);
              }}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => mediaFileRef.current?.click()}
                disabled={uploading}
                className="text-xs tracking-wider text-stone-600 border border-stone-300 px-4 py-2 hover:border-stone-500 transition-colors disabled:opacity-40"
              >
                {uploading ? 'アップロード中...' : data.media_url ? 'メディアを差し替え' : 'メディアをアップロード'}
              </button>
              {data.media_url && (
                <button
                  type="button"
                  onClick={deleteMedia}
                  disabled={uploading}
                  className="text-xs tracking-wider text-red-400 border border-red-200 px-4 py-2 hover:border-red-400 transition-colors disabled:opacity-40"
                >
                  削除
                </button>
              )}
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              画像: jpg / png / webp / gif（5MB以下）　動画: mp4 / mov / webm（50MB以下）
            </p>
          </div>

          {/* 画像比率 */}
          <div className="border border-stone-200 p-6">
            <label className="block text-[10px] tracking-widest text-stone-500 mb-3">画像比率</label>
            <div className="flex gap-6 flex-wrap">
              {([
                { value: 'video',    label: '16:9（横長）' },
                { value: 'portrait', label: '4:5（縦長）' },
                { value: 'square',   label: '1:1（正方形）' },
                { value: 'vertical', label: '9:16（縦長）' },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="radio"
                    name="media_aspect"
                    value={value}
                    checked={form.media_aspect === value}
                    onChange={() => setField('media_aspect', value)}
                    className="accent-stone-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* 表示位置 */}
          <div className="border border-stone-200 p-6">
            <label className="block text-[10px] tracking-widest text-stone-500 mb-3">表示位置</label>
            <select
              value={form.media_position}
              onChange={e => setField('media_position', e.target.value as Form['media_position'])}
              className="text-xs text-stone-700 border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
            >
              <option value="center">中央</option>
              <option value="top">上</option>
              <option value="bottom">下</option>
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>

          {/* 保存 */}
          <div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="text-xs tracking-wider text-white bg-stone-800 px-8 py-3 hover:bg-stone-700 transition-colors disabled:opacity-40"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
