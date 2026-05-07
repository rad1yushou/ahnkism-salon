'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type HeroSlide = {
  id: string;
  image_url: string | null;
  alt: string | null;
  label: string | null;
  media_type: 'image' | 'video';
  draft_image_url: string | null;
  draft_alt: string | null;
  draft_label: string | null;
  draft_media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

type Pickup = {
  id: string | null;
  image_url: string | null;
  alt: string | null;
  label: string;
  link_href: string | null;
  media_type: 'image' | 'video';
  draft_image_url: string | null;
  draft_alt: string | null;
  draft_label: string | null;
  draft_link_href: string | null;
  draft_media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;
const BUCKET = 'ahnkism-public';

const PICKUP_SLOTS: { sort_order: number; label: string }[] = [
  { sort_order: 1, label: '髪質改善' },
  { sort_order: 2, label: '艶髪カラー' },
  { sort_order: 3, label: '縮毛矯正' },
  { sort_order: 4, label: '韓国ヘア' },
];

function extractStoragePath(imageUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

function getMediaType(file: File): 'image' | 'video' | null {
  if (IMAGE_TYPES.includes(file.type)) return 'image';
  if (VIDEO_TYPES.includes(file.type)) return 'video';
  return null;
}

function validateFile(file: File): string | null {
  const mediaType = getMediaType(file);
  if (!mediaType) return 'jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます';
  const maxSize = mediaType === 'video' ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (file.size > maxSize) {
    return mediaType === 'video'
      ? '動画のサイズは 50MB 以下にしてください'
      : '画像のサイズは 5MB 以下にしてください';
  }
  return null;
}

type StatusBadge = { text: string; color: string };

// 管理画面用メディアプレビュー（画像 or 動画）
function MediaPreview({
  src,
  alt,
  mediaType,
  aspectClass,
  statusBadge,
}: {
  src: string;
  alt: string;
  mediaType: 'image' | 'video';
  aspectClass: string;
  statusBadge?: StatusBadge;
}) {
  return (
    <div className={`relative ${aspectClass} bg-stone-100 overflow-hidden rounded`}>
      {/* 左上: ステータスバッジ */}
      {statusBadge && (
        <span className={`absolute top-1 left-1 z-20 text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${statusBadge.color}`}>
          {statusBadge.text}
        </span>
      )}
      {/* 右上: メディアタイプバッジ */}
      <span className="absolute top-1 right-1 z-20 text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-white font-medium">
        {mediaType === 'video' ? '動画' : '画像'}
      </span>

      {mediaType === 'video' ? (
        <>
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-60"
          />
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-contain z-10"
          />
        </>
      ) : (
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      )}
    </div>
  );
}

export default function AdminImagesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draftLabelInputs, setDraftLabelInputs] = useState<Record<number, string>>({});

  const [heroAlt, setHeroAlt] = useState('');
  const [heroLabel, setHeroLabel] = useState('');
  const heroFileRef = useRef<HTMLInputElement>(null);
  const pickupFileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const [heroRes, pickupRes] = await Promise.all([
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
      supabase.from('pickups').select('*').order('sort_order', { ascending: true }),
    ]);

    if (heroRes.data) setHeroSlides(heroRes.data);

    const dbPickups: Pickup[] = pickupRes.data ?? [];
    const merged: Pickup[] = PICKUP_SLOTS.map(slot => {
      const found =
        dbPickups.find(p => p.sort_order === slot.sort_order) ??
        dbPickups.find(p => p.label === slot.label) ??
        null;
      return found ?? {
        id: null,
        image_url: null,
        alt: null,
        label: slot.label,
        link_href: null,
        media_type: 'image',
        draft_image_url: null,
        draft_alt: null,
        draft_label: null,
        draft_link_href: null,
        draft_media_type: null,
        sort_order: slot.sort_order,
        is_active: false,
      };
    });
    setPickups(merged);
    setDraftLabelInputs(
      merged.reduce<Record<number, string>>((acc, p) => {
        acc[p.sort_order] = p.draft_label ?? '';
        return acc;
      }, {})
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Hero: 下書きとして新規スライドを追加 ──────────────
  const uploadHeroImage = async (file: File) => {
    if (!supabase) return;
    const err = validateFile(file);
    if (err) { showMessage(err); return; }

    const mediaType = getMediaType(file)!;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `hero/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const nextOrder =
        heroSlides.length > 0 ? Math.max(...heroSlides.map(s => s.sort_order)) + 1 : 1;

      const { error: dbErr } = await supabase.from('hero_slides').insert({
        image_url: null,
        alt: null,
        label: null,
        media_type: 'image',
        draft_image_url: publicUrl,
        draft_alt: heroAlt || null,
        draft_label: heroLabel || null,
        draft_media_type: mediaType,
        sort_order: nextOrder,
        is_active: false,
      });
      if (dbErr) { showMessage(`DB 保存失敗: ${dbErr.message}`); return; }

      setHeroAlt('');
      setHeroLabel('');
      if (heroFileRef.current) heroFileRef.current.value = '';
      showMessage('下書きとして保存しました。「サイトに反映」ボタンで公開できます。');
      await loadData();
    } finally {
      setUploading(false);
    }
  };

  // ── Hero: 下書きを公開 ────────────────────────────────
  const publishHeroSlide = async (slide: HeroSlide) => {
    if (!supabase || !slide.draft_image_url) return;
    const { error } = await supabase
      .from('hero_slides')
      .update({
        image_url: slide.draft_image_url,
        alt: slide.draft_alt ?? slide.alt,
        label: slide.draft_label ?? slide.label,
        media_type: slide.draft_media_type ?? 'image',
        is_active: true,
        draft_image_url: null,
        draft_alt: null,
        draft_label: null,
        draft_media_type: null,
      })
      .eq('id', slide.id);
    if (error) { showMessage(`反映失敗: ${error.message}`); return; }
    showMessage('サイトに反映しました');
    await loadData();
  };

  // ── Hero: 下書きを破棄 ────────────────────────────────
  const discardHeroDraft = async (slide: HeroSlide) => {
    if (!supabase || !slide.draft_image_url) return;
    if (!confirm('下書きだけを破棄します。公開中の画像・動画は残ります。')) return;

    const draftPath = extractStoragePath(slide.draft_image_url);
    if (draftPath) await supabase.storage.from(BUCKET).remove([draftPath]);

    if (!slide.image_url) {
      await supabase.from('hero_slides').delete().eq('id', slide.id);
    } else {
      await supabase.from('hero_slides')
        .update({ draft_image_url: null, draft_alt: null, draft_label: null, draft_media_type: null })
        .eq('id', slide.id);
    }

    showMessage('下書きを破棄しました');
    await loadData();
  };

  // ── Hero: 公開済み画像を削除 ──────────────────────────
  const deleteHeroSlide = async (slide: HeroSlide) => {
    if (!supabase || !confirm('公開済み画像・下書きをすべて削除します。元に戻せません。')) return;

    if (slide.image_url) {
      const storagePath = extractStoragePath(slide.image_url);
      if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    if (slide.draft_image_url) {
      const draftPath = extractStoragePath(slide.draft_image_url);
      if (draftPath) await supabase.storage.from(BUCKET).remove([draftPath]);
    }

    const { error } = await supabase.from('hero_slides').delete().eq('id', slide.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }

    showMessage('削除しました');
    await loadData();
  };

  // ── Hero: is_active トグル ────────────────────────────
  const toggleHeroActive = async (slide: HeroSlide) => {
    if (!supabase) return;
    await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
    await loadData();
  };

  // ── Pickup: 下書きとして画像を保存 ───────────────────
  const uploadPickupImage = async (file: File, slot: Pickup) => {
    if (!supabase) return;
    const err = validateFile(file);
    if (err) { showMessage(err); return; }

    const mediaType = getMediaType(file)!;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `pickup/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (slot.draft_image_url) {
        const oldDraftPath = extractStoragePath(slot.draft_image_url);
        if (oldDraftPath) await supabase.storage.from(BUCKET).remove([oldDraftPath]);
      }

      if (slot.id) {
        const { error } = await supabase
          .from('pickups')
          .update({
            draft_image_url: publicUrl,
            draft_alt: slot.alt ?? slot.label,
            draft_media_type: mediaType,
          })
          .eq('id', slot.id);
        if (error) { showMessage(`DB 更新失敗: ${error.message}`); return; }
      } else {
        const { error } = await supabase.from('pickups').insert({
          image_url: null,
          alt: null,
          label: slot.label,
          media_type: 'image',
          draft_image_url: publicUrl,
          draft_alt: slot.label,
          draft_media_type: mediaType,
          sort_order: slot.sort_order,
          is_active: false,
        });
        if (error) { showMessage(`DB 保存失敗: ${error.message}`); return; }
      }

      showMessage(`${slot.label} を下書き保存しました。「サイトに反映」ボタンで公開できます。`);
      await loadData();
    } finally {
      setUploading(false);
    }
  };

  // ── Pickup: ラベルだけ下書き保存 ─────────────────────
  const saveDraftLabel = async (slot: Pickup, value: string) => {
    if (!supabase || !value.trim()) return;
    if (slot.id) {
      const { error } = await supabase
        .from('pickups')
        .update({ draft_label: value.trim() })
        .eq('id', slot.id);
      if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    } else {
      const { error } = await supabase.from('pickups').insert({
        image_url: null,
        alt: null,
        label: slot.label,
        media_type: 'image',
        draft_label: value.trim(),
        sort_order: slot.sort_order,
        is_active: false,
      });
      if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    }
    showMessage(`${slot.label} のラベルを下書き保存しました`);
    await loadData();
  };

  // ── Pickup: 下書きを公開 ──────────────────────────────
  const publishPickup = async (slot: Pickup) => {
    if (!supabase || !slot.id || (!slot.draft_image_url && !slot.draft_label)) return;

    const updateData: Record<string, unknown> = {
      draft_image_url: null,
      draft_alt: null,
      draft_label: null,
      draft_media_type: null,
      draft_link_href: null,
    };

    if (slot.draft_image_url) {
      if (slot.image_url) {
        const oldPath = extractStoragePath(slot.image_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      updateData.image_url = slot.draft_image_url;
      updateData.alt = slot.draft_alt ?? slot.alt ?? slot.label;
      updateData.media_type = slot.draft_media_type ?? 'image';
      updateData.is_active = true;
    }

    if (slot.draft_label) {
      updateData.label = slot.draft_label;
    }

    const { error } = await supabase
      .from('pickups')
      .update(updateData)
      .eq('id', slot.id);
    if (error) { showMessage(`反映失敗: ${error.message}`); return; }
    showMessage(`${slot.label} をサイトに反映しました`);
    await loadData();
  };

  // ── Pickup: 下書きを破棄 ──────────────────────────────
  const discardPickupDraft = async (slot: Pickup) => {
    if (!supabase || !slot.id || (!slot.draft_image_url && !slot.draft_label)) return;
    if (!confirm('下書きだけを破棄します。公開中の画像・動画は残ります。')) return;

    if (slot.draft_image_url) {
      const draftPath = extractStoragePath(slot.draft_image_url);
      if (draftPath) await supabase.storage.from(BUCKET).remove([draftPath]);
    }

    await supabase.from('pickups')
      .update({ draft_image_url: null, draft_alt: null, draft_label: null, draft_media_type: null, draft_link_href: null })
      .eq('id', slot.id);

    showMessage('下書きを破棄しました');
    await loadData();
  };

  // ── Hero 枚数表示 ─────────────────────────────────────
  const heroCount = heroSlides.length;
  const heroRemaining = 4 - heroCount;
  const heroCountLabel = heroRemaining > 0
    ? `${heroCount} / 4 枚・残り${heroRemaining}枠`
    : `${heroCount} / 4 枚・上限に達しました`;
  const heroCountColor = heroRemaining === 0 ? 'text-amber-500' : 'text-stone-400';

  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">画像管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          画像・動画は下書き保存後、「サイトに反映」ボタンで公開されます
        </p>
      </div>

      {/* 動画使用時の注意 */}
      <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 text-xs text-blue-800 leading-relaxed">
        <span className="font-medium">動画使用時の注意：</span>
        動画ファイルはサイズが大きいため、トップページの読み込みが遅くなる場合があります。
        Hero スライダーへの動画使用は <span className="font-medium">1〜2 本以内</span> を推奨します。
        また、動画は自動再生（音なし）されます。
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

      {/* ── Hero スライダー ── */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider mb-4">
          Hero スライダー
          <span className={`ml-2 text-xs font-normal ${heroCountColor}`}>
            （{heroCountLabel}）画像・動画混在可
          </span>
        </h2>

        {loading ? (
          <p className="text-xs text-stone-400">読み込み中...</p>
        ) : heroSlides.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {heroSlides.map(slide => (
              <div key={slide.id} className="flex flex-col gap-1.5">

                {/* 公開済み */}
                {slide.image_url && (
                  <div>
                    <MediaPreview
                      src={slide.image_url}
                      alt={slide.alt ?? ''}
                      mediaType={slide.media_type}
                      aspectClass="aspect-[16/9]"
                      statusBadge={
                        slide.is_active
                          ? { text: '公開中', color: 'bg-green-500' }
                          : { text: '非表示中', color: 'bg-stone-400' }
                      }
                    />
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      {slide.label ?? '(ラベルなし)'}
                    </p>
                    <div className="flex gap-1.5 mt-1">
                      <button
                        onClick={() => toggleHeroActive(slide)}
                        disabled={!isConfigured}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          slide.is_active
                            ? 'border-green-400 text-green-600'
                            : 'border-stone-300 text-stone-400'
                        }`}
                      >
                        {slide.is_active ? '表示中' : '非表示'}
                      </button>
                      <button
                        onClick={() => deleteHeroSlide(slide)}
                        disabled={!isConfigured}
                        className="text-[10px] px-2 py-0.5 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}

                {/* 下書きプレビュー */}
                {slide.draft_image_url && (
                  <div className="border border-amber-300 rounded p-1.5 mt-1">
                    <MediaPreview
                      src={slide.draft_image_url}
                      alt={slide.draft_alt ?? ''}
                      mediaType={slide.draft_media_type ?? 'image'}
                      aspectClass="aspect-[16/9]"
                      statusBadge={{ text: '下書き', color: 'bg-amber-500' }}
                    />
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">
                      {slide.draft_label ?? '(ラベルなし)'}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      <button
                        onClick={() => publishHeroSlide(slide)}
                        disabled={!isConfigured}
                        className="flex-1 text-[10px] py-0.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40"
                      >
                        サイトに反映
                      </button>
                      <button
                        onClick={() => discardHeroDraft(slide)}
                        disabled={!isConfigured}
                        className="flex-1 text-[10px] py-0.5 rounded border border-stone-300 text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40"
                      >
                        下書きを破棄
                      </button>
                    </div>
                  </div>
                )}

                {!slide.image_url && !slide.draft_image_url && (
                  <button
                    onClick={() => deleteHeroSlide(slide)}
                    disabled={!isConfigured}
                    className="text-[10px] px-2 py-0.5 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 mb-4">画像・動画が登録されていません</p>
        )}

        {heroSlides.length < 4 ? (
          <div className="border border-dashed border-stone-300 rounded p-4 space-y-3">
            <p className="text-xs text-stone-500 font-medium">下書きとして追加</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="ラベル（例：HAIR QUALITY）"
                value={heroLabel}
                onChange={e => setHeroLabel(e.target.value)}
                disabled={!isConfigured}
                className="border border-stone-300 rounded px-3 py-1.5 text-xs flex-1 disabled:bg-stone-50 disabled:text-stone-400"
              />
              <input
                type="text"
                placeholder="alt テキスト"
                value={heroAlt}
                onChange={e => setHeroAlt(e.target.value)}
                disabled={!isConfigured}
                className="border border-stone-300 rounded px-3 py-1.5 text-xs flex-1 disabled:bg-stone-50 disabled:text-stone-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={heroFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                disabled={!isConfigured || uploading}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadHeroImage(file);
                }}
                className="text-xs text-stone-600 file:mr-3 file:text-xs file:py-1 file:px-3 file:border file:border-stone-300 file:rounded file:bg-white file:cursor-pointer disabled:opacity-40"
              />
              {uploading && <span className="text-xs text-stone-400">アップロード中...</span>}
            </div>
            <p className="text-[10px] text-stone-400">
              画像: jpg / png / webp / gif・5MB 以下　／　動画: mp4 / mov / webm・50MB 以下
            </p>
          </div>
        ) : (
          <p className="text-xs text-amber-600 border border-dashed border-amber-200 rounded p-3 text-center">
            4 枚登録済みです。追加する場合はいずれかを削除してください。
          </p>
        )}
      </section>

      {/* ── Pickup 画像 ── */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider mb-4">
          Pickup（4 枚固定）
          <span className="ml-2 text-xs font-normal text-stone-400">画像・動画混在可</span>
        </h2>

        {loading ? (
          <p className="text-xs text-stone-400">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {pickups.map((slot, i) => {
              const hasDraft = !!(slot.draft_image_url || slot.draft_label);
              return (
                <div key={slot.sort_order} className="flex flex-col gap-2">
                  {/* 公開ラベル */}
                  <p className="text-[10px] font-medium text-stone-600 tracking-wider">
                    {slot.label}
                  </p>

                  {/* 公開済み */}
                  {slot.image_url ? (
                    <MediaPreview
                      src={slot.image_url}
                      alt={slot.alt ?? slot.label}
                      mediaType={slot.media_type}
                      aspectClass="aspect-[4/5]"
                      statusBadge={
                        slot.is_active
                          ? { text: '公開中', color: 'bg-green-500' }
                          : { text: '非表示中', color: 'bg-stone-400' }
                      }
                    />
                  ) : (
                    <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden rounded flex items-center justify-center">
                      <span className="text-[10px] text-stone-400 tracking-widest">
                        {slot.draft_image_url ? '未公開' : 'IMAGE'}
                      </span>
                    </div>
                  )}

                  {/* 下書きプレビュー（画像あり）*/}
                  {slot.draft_image_url && (
                    <div className="border border-amber-300 rounded p-1.5">
                      <MediaPreview
                        src={slot.draft_image_url}
                        alt={slot.draft_alt ?? slot.label}
                        mediaType={slot.draft_media_type ?? 'image'}
                        aspectClass="aspect-[4/5]"
                        statusBadge={{ text: '下書き', color: 'bg-amber-500' }}
                      />
                      {slot.draft_label && (
                        <p className="text-[10px] text-amber-600 mt-1 truncate">
                          ラベル下書き: {slot.draft_label}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 下書きプレビュー（ラベルのみ）*/}
                  {!slot.draft_image_url && slot.draft_label && (
                    <div className="border border-amber-300 rounded p-1.5">
                      <p className="text-[9px] text-amber-500 font-medium mb-0.5">下書き</p>
                      <p className="text-[10px] text-stone-700 truncate">ラベル: {slot.draft_label}</p>
                    </div>
                  )}

                  {/* サイトに反映 / 下書きを破棄 */}
                  {hasDraft && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => publishPickup(slot)}
                        disabled={!isConfigured}
                        className="flex-1 text-[10px] py-0.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40"
                      >
                        サイトに反映
                      </button>
                      <button
                        onClick={() => discardPickupDraft(slot)}
                        disabled={!isConfigured}
                        className="flex-1 text-[10px] py-0.5 rounded border border-stone-300 text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40"
                      >
                        下書きを破棄
                      </button>
                    </div>
                  )}

                  {/* ラベル編集 */}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={draftLabelInputs[slot.sort_order] ?? ''}
                      onChange={e =>
                        setDraftLabelInputs(prev => ({ ...prev, [slot.sort_order]: e.target.value }))
                      }
                      placeholder={slot.label ?? 'ラベルを入力'}
                      disabled={!isConfigured}
                      className="flex-1 min-w-0 border border-stone-300 rounded px-2 py-0.5 text-[10px] disabled:bg-stone-50 disabled:text-stone-400"
                    />
                    <button
                      onClick={() => saveDraftLabel(slot, draftLabelInputs[slot.sort_order] ?? '')}
                      disabled={!isConfigured || !(draftLabelInputs[slot.sort_order] ?? '').trim()}
                      className="text-[10px] px-1.5 py-0.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      下書き保存
                    </button>
                  </div>

                  {/* アップロードボタン */}
                  <input
                    ref={el => { pickupFileRefs.current[i] = el; }}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                    className="hidden"
                    disabled={!isConfigured || uploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadPickupImage(file, slot);
                    }}
                  />
                  <button
                    onClick={() => pickupFileRefs.current[i]?.click()}
                    disabled={!isConfigured || uploading}
                    className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                  >
                    {slot.draft_image_url
                      ? '下書きを差し替え'
                      : slot.image_url
                      ? '差し替え用の下書きを追加'
                      : '画像 / 動画をアップロード'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-stone-400 mt-4">
          画像: jpg / png / webp / gif・5MB 以下　／　動画: mp4 / mov / webm・50MB 以下
        </p>
      </section>
    </div>
  );
}
