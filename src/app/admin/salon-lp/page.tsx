'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

// Supabase select フィールド（1行で定義）
const LP_SECTION_SELECT = 'id, salon_slug, section_type, title, body, media_url, media_type, media_aspect, media_position, sort_order, is_active';

const SALON_SLUGS = ['labo', 'nit', 'elu', 'olea'] as const;
type SalonSlug = typeof SALON_SLUGS[number];

const SECTION_LABELS: Record<string, string> = {
  hero:         'ヒーロー（メイン）',
  intro:        'サロン紹介',
  atmosphere:   '店内の雰囲気',
  technique:    'おすすめ技術',
  staff_vibe:   'スタッフの雰囲気',
  before_after: 'Before / After',
};

function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function getAspectClass(aspect: string): string {
  if (aspect === 'portrait') return 'aspect-[4/5]';
  if (aspect === 'square') return 'aspect-square';
  if (aspect === 'vertical') return 'aspect-[9/16]';
  return 'aspect-video';
}

function getPositionClass(position: string): string {
  if (position === 'top') return 'object-top';
  if (position === 'bottom') return 'object-bottom';
  if (position === 'left') return 'object-left';
  if (position === 'right') return 'object-right';
  return 'object-center';
}

type LpSection = {
  id: string;
  salon_slug: string;
  section_type: string;
  title: string;
  body: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  sort_order: number;
  is_active: boolean;
};

type SectionForm = {
  title: string;
  body: string;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  is_active: boolean;
};

export default function AdminSalonLpPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [selectedSlug, setSelectedSlug] = useState<SalonSlug>('labo');
  const [sections, setSections] = useState<LpSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SectionForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const pendingSection = useRef<LpSection | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadSections = useCallback(async (slug: string) => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('salon_lp_sections')
      .select(LP_SECTION_SELECT)
      .eq('salon_slug', slug)
      .order('sort_order', { ascending: true });
    setLoading(false);
    if (error) { showMessage(`読み込み失敗: ${error.message}`); return; }
    setSections((data ?? []).map(r => ({
      id: r.id,
      salon_slug: r.salon_slug,
      section_type: r.section_type,
      title: r.title ?? '',
      body: r.body ?? '',
      media_url: r.media_url ?? null,
      media_type: (r.media_type ?? null) as 'image' | 'video' | null,
      media_aspect: (r.media_aspect ?? 'video') as LpSection['media_aspect'],
      media_position: (r.media_position ?? 'center') as LpSection['media_position'],
      sort_order: r.sort_order,
      is_active: r.is_active,
    })));
  }, [supabase]);

  useEffect(() => {
    setEditingId(null);
    setForm(null);
    loadSections(selectedSlug);
  }, [loadSections, selectedSlug]);

  const setField = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const startEdit = (sec: LpSection) => {
    setEditingId(sec.id);
    setForm({
      title: sec.title,
      body: sec.body,
      media_aspect: sec.media_aspect,
      media_position: sec.media_position,
      is_active: sec.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const saveEdit = async (sectionId: string) => {
    if (!supabase || !form) return;
    setSaving(true);
    const { error } = await supabase
      .from('salon_lp_sections')
      .update({
        title: form.title,
        body: form.body,
        media_aspect: form.media_aspect,
        media_position: form.media_position,
        is_active: form.is_active,
      })
      .eq('id', sectionId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadSections(selectedSlug);
  };

  const uploadMedia = async (file: File, sec: LpSection) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます');
      return;
    }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > VIDEO_MAX_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploading(true);
    setUploadingId(sec.id);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${sec.salon_slug}/lp/${sec.section_type}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (sec.media_url) {
        const oldPath = extractStoragePath(sec.media_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const { error: dbErr } = await supabase
        .from('salon_lp_sections')
        .update({ media_url: publicUrl, media_type: mediaType })
        .eq('id', sec.id);
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      showMessage('メディアをアップロードしました');
      await loadSections(selectedSlug);
    } finally {
      setUploading(false);
      setUploadingId(null);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
      pendingSection.current = null;
    }
  };

  const deleteMedia = async (sec: LpSection) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    if (sec.media_url) {
      const oldPath = extractStoragePath(sec.media_url);
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    const { error } = await supabase
      .from('salon_lp_sections')
      .update({ media_url: null, media_type: null })
      .eq('id', sec.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage('メディアを削除しました');
    await loadSections(selectedSlug);
  };

  const moveSection = async (sectionId: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = sections.findIndex(s => s.id === sectionId);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const a = sections[idx];
    const b = sections[targetIdx];
    await Promise.all([
      supabase.from('salon_lp_sections').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('salon_lp_sections').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadSections(selectedSlug);
  };

  if (!isConfigured) {
    return <div className="text-xs text-stone-400 tracking-wider">Supabase が設定されていません</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-1">Admin</p>
        <h1 className="text-xl font-light tracking-wider text-stone-800">店舗LP管理</h1>
        <p className="text-xs text-stone-400 mt-1">各店舗の LP セクション（動画・雰囲気・技術など）を管理します</p>
      </div>

      {message && (
        <div className="mb-6 px-4 py-2 bg-stone-100 text-xs text-stone-600 tracking-wider">
          {message}
        </div>
      )}

      {/* 店舗選択 */}
      <div className="flex gap-2 mb-8">
        {SALON_SLUGS.map(slug => (
          <button
            key={slug}
            type="button"
            onClick={() => setSelectedSlug(slug)}
            className={`text-xs tracking-wider px-4 py-2 border transition-colors ${selectedSlug === slug ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300 hover:border-stone-500'}`}
          >
            {slug}
          </button>
        ))}
      </div>

      {/* hidden file input */}
      <input
        ref={mediaFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && pendingSection.current) uploadMedia(file, pendingSection.current);
        }}
      />

      {/* セクション一覧 */}
      {loading ? (
        <p className="text-xs text-stone-400 tracking-wider">読み込み中...</p>
      ) : sections.length === 0 ? (
        <div className="border border-red-200 p-6 text-xs text-red-500 leading-relaxed">
          <p className="font-medium mb-2">セクションが見つかりません</p>
          <p>supabase/028_salon_lp_sections.sql が正しく実行されているか確認してください。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec, i) => {
            const isEditing = editingId === sec.id;
            const label = SECTION_LABELS[sec.section_type] ?? sec.section_type;
            const isUploading = uploading && uploadingId === sec.id;

            return (
              <div key={sec.id} className="border border-stone-200">
                {/* ヘッダー行 */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 shrink-0 ${sec.is_active ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'}`}>
                    {sec.is_active ? '公開' : '非表示'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 tracking-wider">{label}</p>
                    {sec.title && (
                      <p className="text-sm text-stone-700 font-light truncate">{sec.title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => moveSection(sec.id, 'up')} disabled={i === 0} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1" title="上に移動">↑</button>
                    <button type="button" onClick={() => moveSection(sec.id, 'down')} disabled={i === sections.length - 1} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1" title="下に移動">↓</button>
                    <button
                      type="button"
                      onClick={() => isEditing ? cancelEdit() : startEdit(sec)}
                      className="text-xs tracking-wider text-stone-600 border border-stone-300 px-3 py-1 hover:border-stone-500 transition-colors ml-2"
                    >
                      {isEditing ? 'キャンセル' : '編集'}
                    </button>
                  </div>
                </div>

                {/* 編集フォーム */}
                {isEditing && form && (
                  <div className="border-t border-stone-200 p-5 space-y-5 bg-stone-50">
                    {/* 公開設定 */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={e => setField('is_active', e.target.checked)}
                        className="accent-stone-600"
                      />
                      <span className="text-xs text-stone-600 tracking-wider">公開する</span>
                    </label>

                    {/* タイトル */}
                    <div>
                      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">タイトル</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setField('title', e.target.value)}
                        className="w-full text-xs text-stone-700 border border-stone-200 p-2 focus:outline-none focus:border-stone-400"
                        placeholder="セクションタイトル"
                      />
                    </div>

                    {/* 本文 */}
                    <div>
                      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">本文</label>
                      <textarea
                        value={form.body}
                        onChange={e => setField('body', e.target.value)}
                        rows={4}
                        className="w-full text-xs text-stone-700 border border-stone-200 p-2 leading-relaxed resize-y focus:outline-none focus:border-stone-400"
                        placeholder="本文テキスト（改行可）"
                      />
                    </div>

                    {/* メディア */}
                    <div>
                      <p className="text-[10px] tracking-widest text-stone-500 mb-3">画像 / 動画</p>
                      {sec.media_url && (
                        <div className="mb-3">
                          <div className={`${getAspectClass(form.media_aspect)} bg-stone-100 overflow-hidden relative w-full max-w-xs`}>
                            {sec.media_type === 'video' ? (
                              <video
                                src={sec.media_url}
                                className={`absolute inset-0 w-full h-full object-cover ${getPositionClass(form.media_position)}`}
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={sec.media_url}
                                alt={sec.title || label}
                                fill
                                className={`object-cover ${getPositionClass(form.media_position)}`}
                                unoptimized
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1 truncate max-w-xs">{sec.media_url}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { pendingSection.current = sec; mediaFileRef.current?.click(); }}
                          disabled={isUploading}
                          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-3 py-1.5 hover:border-stone-500 transition-colors disabled:opacity-40"
                        >
                          {isUploading ? 'アップロード中...' : sec.media_url ? '差し替え' : 'アップロード'}
                        </button>
                        {sec.media_url && (
                          <button
                            type="button"
                            onClick={() => deleteMedia(sec)}
                            disabled={isUploading}
                            className="text-xs tracking-wider text-red-400 border border-red-200 px-3 py-1.5 hover:border-red-400 transition-colors disabled:opacity-40"
                          >
                            削除
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">画像: jpg/png/webp/gif（5MB以下）　動画: mp4/mov/webm（50MB以下）</p>
                    </div>

                    {/* 画像比率 */}
                    <div>
                      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">画像比率</label>
                      <div className="flex gap-5 flex-wrap">
                        {([
                          { value: 'video',    label: '16:9' },
                          { value: 'portrait', label: '4:5' },
                          { value: 'square',   label: '1:1' },
                          { value: 'vertical', label: '9:16' },
                        ] as const).map(({ value, label: l }) => (
                          <label key={value} className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`aspect_${sec.id}`}
                              value={value}
                              checked={form.media_aspect === value}
                              onChange={() => setField('media_aspect', value)}
                              className="accent-stone-600"
                            />
                            {l}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 表示位置 */}
                    <div>
                      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">表示位置</label>
                      <select
                        value={form.media_position}
                        onChange={e => setField('media_position', e.target.value as SectionForm['media_position'])}
                        className="text-xs text-stone-700 border border-stone-200 px-3 py-1.5 focus:outline-none focus:border-stone-400"
                      >
                        <option value="center">中央</option>
                        <option value="top">上</option>
                        <option value="bottom">下</option>
                        <option value="left">左</option>
                        <option value="right">右</option>
                      </select>
                    </div>

                    {/* 保存 */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => saveEdit(sec.id)}
                        disabled={saving}
                        className="text-xs tracking-wider text-white bg-stone-800 px-6 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40"
                      >
                        {saving ? '保存中...' : '保存する'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs tracking-wider text-stone-600 border border-stone-300 px-6 py-2 hover:border-stone-500 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
