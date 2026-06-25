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
const LP_SECTION_SELECT = 'id, salon_slug, section_type, title, body, media_url, media_type, media_aspect, media_position, hero_title_position, hero_title_y_percent, layout_type, sort_order, is_active';

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

type SalonPickup = {
  id: string;
  salon_slug: string;
  image_url: string | null;
  alt: string | null;
  label: string | null;
  link_href: string | null;
  media_type: 'image' | 'video';
  sort_order: number;
  is_active: boolean;
};

type PickupMeta = {
  label: string;
  alt: string;
  link_href: string;
};

type HeroSlide = {
  id: string;
  salon_slug: string;
  media_url: string;
  media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

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
  hero_title_position: 'top' | 'center' | 'bottom';
  hero_title_y_percent: number;
  layout_type: 'detail' | 'pickup';
  sort_order: number;
  is_active: boolean;
};

type SectionMedia = {
  id: string;
  section_id: string;
  media_url: string;
  media_type: 'image' | 'video' | null;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  sort_order: number;
  is_active: boolean;
  title: string | null;
  description: string | null;
};

type SectionForm = {
  title: string;
  body: string;
  media_aspect: 'video' | 'portrait' | 'square' | 'vertical';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  hero_title_position: 'top' | 'center' | 'bottom';
  hero_title_y_percent: number;
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

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const heroSlideFileRef = useRef<HTMLInputElement>(null);

  const [sectionMedia, setSectionMedia] = useState<SectionMedia[]>([]);
  const [loadingSectionMedia, setLoadingSectionMedia] = useState(false);
  const [uploadingSectionMedia, setUploadingSectionMedia] = useState(false);
  const sectionMediaFileRef = useRef<HTMLInputElement>(null);
  const pendingSectionMedia = useRef<{ sectionId: string; sectionType: string } | null>(null);
  const [editingSectionMediaId, setEditingSectionMediaId] = useState<string | null>(null);
  const [sectionMediaMeta, setSectionMediaMeta] = useState<{ title: string; description: string }>({ title: '', description: '' });

  const [salonPickups, setSalonPickups] = useState<SalonPickup[]>([]);
  const [loadingPickups, setLoadingPickups] = useState(false);
  const [uploadingPickup, setUploadingPickup] = useState(false);
  const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
  const [pickupMeta, setPickupMeta] = useState<PickupMeta>({ label: '', alt: '', link_href: '' });
  const salonPickupFileRef = useRef<HTMLInputElement>(null);

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
      hero_title_position: (r.hero_title_position ?? 'center') as LpSection['hero_title_position'],
      hero_title_y_percent: r.hero_title_y_percent ?? 50,
      layout_type: (r.layout_type ?? 'detail') as LpSection['layout_type'],
      sort_order: r.sort_order,
      is_active: r.is_active,
    })));
  }, [supabase]);

  const loadSlides = useCallback(async (slug: string) => {
    if (!supabase) return;
    setLoadingSlides(true);
    const { data, error } = await supabase
      .from('salon_hero_slides')
      .select('id, salon_slug, media_url, media_type, sort_order, is_active')
      .eq('salon_slug', slug)
      .order('sort_order', { ascending: true });
    setLoadingSlides(false);
    if (error) { showMessage(`スライド読み込み失敗: ${error.message}`); return; }
    setHeroSlides((data ?? []).map(r => ({
      id: r.id,
      salon_slug: r.salon_slug,
      media_url: r.media_url,
      media_type: (r.media_type ?? null) as 'image' | 'video' | null,
      sort_order: r.sort_order,
      is_active: r.is_active,
    })));
  }, [supabase]);

  const loadPickups = useCallback(async (slug: string) => {
    if (!supabase) return;
    setLoadingPickups(true);
    const { data, error } = await supabase
      .from('salon_pickups')
      .select('id, salon_slug, image_url, alt, label, link_href, media_type, sort_order, is_active')
      .eq('salon_slug', slug)
      .order('sort_order', { ascending: true });
    setLoadingPickups(false);
    if (error) { showMessage(`ピックアップ読み込み失敗: ${error.message}`); return; }
    setSalonPickups((data ?? []).map(r => ({
      id: r.id,
      salon_slug: r.salon_slug,
      image_url: r.image_url ?? null,
      alt: r.alt ?? null,
      label: r.label ?? null,
      link_href: r.link_href ?? null,
      media_type: (r.media_type ?? 'image') as 'image' | 'video',
      sort_order: r.sort_order,
      is_active: r.is_active,
    })));
  }, [supabase]);

  const loadSectionMedia = useCallback(async (sectionId: string) => {
    if (!supabase) return;
    setLoadingSectionMedia(true);
    const { data, error } = await supabase
      .from('salon_lp_section_media')
      .select('id, section_id, media_url, media_type, media_aspect, media_position, sort_order, is_active, title, description')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });
    setLoadingSectionMedia(false);
    if (error) {
      console.error('[loadSectionMedia] error:', error);
      showMessage(`メディア読み込み失敗: ${error.message}`);
      return;
    }
    console.log('[loadSectionMedia] rows:', data?.length, data);
    setSectionMedia((data ?? []).map(r => ({
      id: r.id,
      section_id: r.section_id,
      media_url: r.media_url,
      media_type: (r.media_type ?? null) as SectionMedia['media_type'],
      media_aspect: (r.media_aspect ?? 'video') as SectionMedia['media_aspect'],
      media_position: (r.media_position ?? 'center') as SectionMedia['media_position'],
      sort_order: r.sort_order,
      is_active: r.is_active,
      title: (r as { title?: string | null }).title ?? null,
      description: (r as { description?: string | null }).description ?? null,
    })));
  }, [supabase]);

  useEffect(() => {
    setEditingId(null);
    setForm(null);
    setEditingPickupId(null);
    loadSections(selectedSlug);
    loadSlides(selectedSlug);
    loadPickups(selectedSlug);
  }, [loadSections, loadSlides, loadPickups, selectedSlug]);

  const MULTI_MEDIA_TYPES = new Set(['atmosphere', 'technique', 'staff_vibe', 'before_after']);

  useEffect(() => {
    if (editingId) {
      const sec = sections.find(s => s.id === editingId);
      if (sec && MULTI_MEDIA_TYPES.has(sec.section_type)) {
        loadSectionMedia(editingId);
      } else {
        setSectionMedia([]);
      }
    } else {
      setSectionMedia([]);
    }
  }, [editingId, sections, loadSectionMedia]);

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
      hero_title_position: sec.hero_title_position,
      hero_title_y_percent: sec.hero_title_y_percent,
      is_active: sec.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const saveEdit = async (sectionId: string) => {
    if (!supabase || !form) return;

    // セッション確認（未認証だと RLS でサイレントに 0 件更新になるため）
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage('セッションが切れています。ページを再読み込みしてログインし直してください。');
      return;
    }

    setSaving(true);
    const { data: updated, error } = await supabase
      .from('salon_lp_sections')
      .update({
        title: form.title,
        body: form.body,
        media_aspect: form.media_aspect,
        media_position: form.media_position,
        hero_title_position: form.hero_title_position,
        hero_title_y_percent: form.hero_title_y_percent,
        is_active: form.is_active,
      })
      .eq('id', sectionId)
      .select('id');
    setSaving(false);

    if (error) {
      console.error('[saveEdit] Supabase error:', error);
      showMessage(`保存失敗: ${error.message}`);
      return;
    }
    if (!updated || updated.length === 0) {
      console.error('[saveEdit] 0 rows updated – RLS or wrong id', { sectionId, session: session.user.email });
      showMessage('保存失敗: 更新対象が見つかりません（権限エラーの可能性があります）');
      return;
    }

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

  const uploadSectionMedia = async (file: File, sectionId: string, sectionType: string) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) { showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます'); return; }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > VIDEO_MAX_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploadingSectionMedia(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${selectedSlug}/lp/${sectionType}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) {
        showMessage(`アップロード失敗: ${uploadErr.message}`);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const nextOrder = sectionMedia.length > 0
        ? Math.max(...sectionMedia.map(m => m.sort_order)) + 1
        : 0;
      const { error: dbErr } = await supabase
        .from('salon_lp_section_media')
        .insert({
          section_id: sectionId,
          media_url: publicUrl,
          media_type: mediaType,
          media_aspect: 'portrait',
          media_position: 'center',
          is_active: true,
          sort_order: nextOrder,
        });
      if (dbErr) {
        showMessage(`DB保存失敗: ${dbErr.code} ${dbErr.message}`);
        return;
      }
      showMessage('メディアを追加しました');
      await loadSectionMedia(sectionId);
    } finally {
      setUploadingSectionMedia(false);
      if (sectionMediaFileRef.current) sectionMediaFileRef.current.value = '';
      pendingSectionMedia.current = null;
    }
  };

  const deleteSectionMedia = async (mediaId: string, mediaUrl: string, sectionId: string) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    const path = extractStoragePath(mediaUrl);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    const { error } = await supabase.from('salon_lp_section_media').delete().eq('id', mediaId);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage('メディアを削除しました');
    await loadSectionMedia(sectionId);
  };

  const moveSectionMedia = async (mediaId: string, sectionId: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = sectionMedia.findIndex(m => m.id === mediaId);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionMedia.length) return;
    const a = sectionMedia[idx];
    const b = sectionMedia[targetIdx];
    await Promise.all([
      supabase.from('salon_lp_section_media').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('salon_lp_section_media').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadSectionMedia(sectionId);
  };

  const toggleSectionMedia = async (mediaId: string, sectionId: string, current: boolean) => {
    if (!supabase) return;
    await supabase.from('salon_lp_section_media').update({ is_active: !current }).eq('id', mediaId);
    await loadSectionMedia(sectionId);
  };

  const updateSectionMediaField = async (mediaId: string, sectionId: string, field: 'media_aspect' | 'media_position', value: string) => {
    if (!supabase) return;
    await supabase.from('salon_lp_section_media').update({ [field]: value }).eq('id', mediaId);
    await loadSectionMedia(sectionId);
  };

  const saveSectionMediaMeta = async (mediaId: string, sectionId: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('salon_lp_section_media')
      .update({
        title: sectionMediaMeta.title || null,
        description: sectionMediaMeta.description || null,
      })
      .eq('id', mediaId);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    setEditingSectionMediaId(null);
    await loadSectionMedia(sectionId);
  };

  const uploadSlide = async (file: File) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます');
      return;
    }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > VIDEO_MAX_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploadingSlide(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${selectedSlug}/hero/slides/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const nextOrder = heroSlides.length > 0
        ? Math.max(...heroSlides.map(s => s.sort_order)) + 1
        : 0;

      const { error: dbErr } = await supabase
        .from('salon_hero_slides')
        .insert({ salon_slug: selectedSlug, media_url: publicUrl, media_type: mediaType, sort_order: nextOrder });
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      showMessage('スライドを追加しました');
      await loadSlides(selectedSlug);
    } finally {
      setUploadingSlide(false);
      if (heroSlideFileRef.current) heroSlideFileRef.current.value = '';
    }
  };

  const deleteSlide = async (slide: HeroSlide) => {
    if (!supabase) return;
    if (!window.confirm('このスライドを削除しますか？')) return;
    const oldPath = extractStoragePath(slide.media_url);
    if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    const { error } = await supabase.from('salon_hero_slides').delete().eq('id', slide.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage('スライドを削除しました');
    await loadSlides(selectedSlug);
  };

  const toggleSlide = async (slide: HeroSlide) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('salon_hero_slides')
      .update({ is_active: !slide.is_active })
      .eq('id', slide.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    await loadSlides(selectedSlug);
  };

  const moveSlide = async (slideId: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = heroSlides.findIndex(s => s.id === slideId);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= heroSlides.length) return;
    const a = heroSlides[idx];
    const b = heroSlides[targetIdx];
    await Promise.all([
      supabase.from('salon_hero_slides').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('salon_hero_slides').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadSlides(selectedSlug);
  };

  const uploadPickup = async (file: File) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます');
      return;
    }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > VIDEO_MAX_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploadingPickup(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${selectedSlug}/pickups/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const nextOrder = salonPickups.length > 0
        ? Math.max(...salonPickups.map(p => p.sort_order)) + 1
        : 0;

      const { error: dbErr } = await supabase
        .from('salon_pickups')
        .insert({ salon_slug: selectedSlug, image_url: publicUrl, media_type: mediaType, sort_order: nextOrder });
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      showMessage('ピックアップを追加しました');
      await loadPickups(selectedSlug);
    } finally {
      setUploadingPickup(false);
      if (salonPickupFileRef.current) salonPickupFileRef.current.value = '';
    }
  };

  const deletePickup = async (pickup: SalonPickup) => {
    if (!supabase) return;
    if (!window.confirm('このピックアップを削除しますか？')) return;
    if (pickup.image_url) {
      const oldPath = extractStoragePath(pickup.image_url);
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    const { error } = await supabase.from('salon_pickups').delete().eq('id', pickup.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage('ピックアップを削除しました');
    if (editingPickupId === pickup.id) setEditingPickupId(null);
    await loadPickups(selectedSlug);
  };

  const togglePickup = async (pickup: SalonPickup) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('salon_pickups')
      .update({ is_active: !pickup.is_active })
      .eq('id', pickup.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    await loadPickups(selectedSlug);
  };

  const movePickup = async (pickupId: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = salonPickups.findIndex(p => p.id === pickupId);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= salonPickups.length) return;
    const a = salonPickups[idx];
    const b = salonPickups[targetIdx];
    await Promise.all([
      supabase.from('salon_pickups').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('salon_pickups').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadPickups(selectedSlug);
  };

  const savePickupMeta = async (pickup: SalonPickup) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('salon_pickups')
      .update({
        label: pickupMeta.label || null,
        alt: pickupMeta.alt || null,
        link_href: pickupMeta.link_href || null,
      })
      .eq('id', pickup.id);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    setEditingPickupId(null);
    await loadPickups(selectedSlug);
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

      {/* hidden file input（LPセクションメディア用） */}
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
      {/* hidden file input（HEROスライド用） */}
      <input
        ref={heroSlideFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadSlide(file);
        }}
      />
      {/* hidden file input（店舗PickUp用） */}
      <input
        ref={salonPickupFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadPickup(file);
        }}
      />
      {/* hidden file input（セクションメディア用） */}
      <input
        ref={sectionMediaFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && pendingSectionMedia.current) {
            uploadSectionMedia(file, pendingSectionMedia.current.sectionId, pendingSectionMedia.current.sectionType);
          }
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

                    {/* 店舗名テキスト位置（hero のみ） */}
                    {sec.section_type === 'hero' && (
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-2">店舗名の縦位置（全スライド共通）</label>
                        {/* 目安ボタン */}
                        <div className="flex gap-2 mb-3">
                          {([
                            { label: '上', y: 22, pos: 'top' },
                            { label: '中央', y: 50, pos: 'center' },
                            { label: '下', y: 78, pos: 'bottom' },
                          ] as const).map(({ label: l, y, pos }) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => {
                                setField('hero_title_y_percent', y);
                                setField('hero_title_position', pos);
                              }}
                              className={`text-xs px-3 py-1 border transition-colors ${form.hero_title_position === pos ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300 hover:border-stone-500'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                        {/* スライダー */}
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={10}
                            max={90}
                            value={form.hero_title_y_percent}
                            onChange={e => {
                              const y = Number(e.target.value);
                              const pos: SectionForm['hero_title_position'] =
                                y <= 33 ? 'top' : y <= 66 ? 'center' : 'bottom';
                              setField('hero_title_y_percent', y);
                              setField('hero_title_position', pos);
                            }}
                            className="flex-1 accent-stone-600"
                          />
                          <span className="text-xs text-stone-500 w-14 shrink-0">現在位置 {form.hero_title_y_percent}%</span>
                        </div>
                      </div>
                    )}

                    {/* HEROスライド管理（hero のみ） */}
                    {sec.section_type === 'hero' && (
                      <div className="border-t border-stone-200 pt-5">
                        <p className="text-[10px] tracking-widest text-stone-500 mb-1">HEROスライド管理</p>
                        <p className="text-[10px] text-stone-400 mb-3">スライドが0件の場合は上記「画像 / 動画」がフォールバックとして表示されます</p>
                        {loadingSlides ? (
                          <p className="text-xs text-stone-400">読み込み中...</p>
                        ) : (
                          <div className="space-y-2 mb-3">
                            {heroSlides.map((slide, si) => (
                              <div key={slide.id} className="flex items-center gap-3 border border-stone-200 p-2 bg-white">
                                {/* サムネイル */}
                                <div className="w-16 h-10 bg-stone-100 overflow-hidden relative shrink-0">
                                  {slide.media_type === 'video' ? (
                                    <video
                                      src={slide.media_url}
                                      className="absolute inset-0 w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <img
                                      src={slide.media_url}
                                      alt={`スライド ${si + 1}`}
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-stone-400 truncate">{slide.media_type === 'video' ? '動画' : '画像'} #{si + 1}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button type="button" onClick={() => moveSlide(slide.id, 'up')} disabled={si === 0} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↑</button>
                                  <button type="button" onClick={() => moveSlide(slide.id, 'down')} disabled={si === heroSlides.length - 1} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↓</button>
                                  <button
                                    type="button"
                                    onClick={() => toggleSlide(slide)}
                                    className={`text-[10px] px-2 py-0.5 border transition-colors ${slide.is_active ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-500 border-stone-300 hover:border-stone-500'}`}
                                  >
                                    {slide.is_active ? '公開' : '非表示'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteSlide(slide)}
                                    className="text-[10px] text-red-400 border border-red-200 px-2 py-0.5 hover:border-red-400 transition-colors"
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                            ))}
                            {heroSlides.length === 0 && (
                              <p className="text-xs text-stone-400">スライドはまだありません</p>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => heroSlideFileRef.current?.click()}
                          disabled={uploadingSlide}
                          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-4 py-1.5 hover:border-stone-500 transition-colors disabled:opacity-40"
                        >
                          {uploadingSlide ? 'アップロード中...' : '+ スライドを追加'}
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1">画像: jpg/png/webp/gif（5MB以下）　動画: mp4/mov/webm（50MB以下）</p>
                      </div>
                    )}

                    {/* 複数メディア管理（atmosphere / technique / staff_vibe / before_after） */}
                    {MULTI_MEDIA_TYPES.has(sec.section_type) && (
                      <div className="border-t border-stone-200 pt-5">
                        <p className="text-[10px] tracking-widest text-stone-500 mb-1">複数メディア管理</p>
                        <p className="text-[10px] text-stone-400 mb-3">メディアが0件の場合は上記「画像 / 動画」がフォールバックとして表示されます</p>
                        {loadingSectionMedia ? (
                          <p className="text-xs text-stone-400">読み込み中...</p>
                        ) : (
                          <div className="space-y-2 mb-3">
                            {sectionMedia.length === 0 && (
                              <p className="text-xs text-stone-400">メディアはまだありません</p>
                            )}
                            {sectionMedia.map((m, mi) => {
                              const isEditingMeta = editingSectionMediaId === m.id;
                              return (
                                <div key={m.id} className="border border-stone-200 bg-white">
                                  {/* 行ヘッダー */}
                                  <div className="flex items-center gap-3 p-2">
                                    <div className="w-16 h-10 bg-stone-100 overflow-hidden relative shrink-0">
                                      {m.media_type === 'video' ? (
                                        <video src={m.media_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                                      ) : (
                                        <img src={m.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex gap-2 mb-1">
                                        <select
                                          value={m.media_aspect}
                                          onChange={e => updateSectionMediaField(m.id, sec.id, 'media_aspect', e.target.value)}
                                          className="text-[10px] text-stone-600 border border-stone-200 px-2 py-0.5 focus:outline-none focus:border-stone-400"
                                        >
                                          <option value="video">16:9</option>
                                          <option value="portrait">4:5</option>
                                          <option value="square">1:1</option>
                                          <option value="vertical">9:16</option>
                                        </select>
                                        <select
                                          value={m.media_position}
                                          onChange={e => updateSectionMediaField(m.id, sec.id, 'media_position', e.target.value)}
                                          className="text-[10px] text-stone-600 border border-stone-200 px-2 py-0.5 focus:outline-none focus:border-stone-400"
                                        >
                                          <option value="center">中央</option>
                                          <option value="top">上</option>
                                          <option value="bottom">下</option>
                                          <option value="left">左</option>
                                          <option value="right">右</option>
                                        </select>
                                      </div>
                                      {(m.title || m.description) && (
                                        <p className="text-[10px] text-stone-400 truncate">{m.title ?? m.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button type="button" onClick={() => moveSectionMedia(m.id, sec.id, 'up')} disabled={mi === 0} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↑</button>
                                      <button type="button" onClick={() => moveSectionMedia(m.id, sec.id, 'down')} disabled={mi === sectionMedia.length - 1} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↓</button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isEditingMeta) {
                                            setEditingSectionMediaId(null);
                                          } else {
                                            setEditingSectionMediaId(m.id);
                                            setSectionMediaMeta({ title: m.title ?? '', description: m.description ?? '' });
                                          }
                                        }}
                                        className={`text-[10px] px-2 py-0.5 border transition-colors ${isEditingMeta ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-500 border-stone-300 hover:border-stone-500'}`}
                                      >
                                        テキスト
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleSectionMedia(m.id, sec.id, m.is_active)}
                                        className={`text-[10px] px-2 py-0.5 border transition-colors ${m.is_active ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-500 border-stone-300 hover:border-stone-500'}`}
                                      >
                                        {m.is_active ? '公開' : '非表示'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteSectionMedia(m.id, m.media_url, sec.id)}
                                        className="text-[10px] text-red-400 border border-red-200 px-2 py-0.5 hover:border-red-400 transition-colors"
                                      >
                                        削除
                                      </button>
                                    </div>
                                  </div>
                                  {/* テキスト編集フォーム */}
                                  {isEditingMeta && (
                                    <div className="border-t border-stone-200 p-3 space-y-3 bg-stone-50">
                                      <div>
                                        <label className="block text-[10px] tracking-widest text-stone-500 mb-1">タイトル</label>
                                        <input
                                          type="text"
                                          value={sectionMediaMeta.title}
                                          onChange={e => setSectionMediaMeta(prev => ({ ...prev, title: e.target.value }))}
                                          className="w-full text-xs text-stone-700 border border-stone-200 p-2 focus:outline-none focus:border-stone-400"
                                          placeholder="例：最高峰髪質改善ストレート"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] tracking-widest text-stone-500 mb-1">説明文</label>
                                        <textarea
                                          value={sectionMediaMeta.description}
                                          onChange={e => setSectionMediaMeta(prev => ({ ...prev, description: e.target.value }))}
                                          rows={3}
                                          className="w-full text-xs text-stone-700 border border-stone-200 p-2 leading-relaxed resize-y focus:outline-none focus:border-stone-400"
                                          placeholder="例：癖や広がりを自然に整え、柔らかく艶のある髪へ導く髪質改善ストレートです。"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => saveSectionMediaMeta(m.id, sec.id)}
                                          className="text-xs tracking-wider text-white bg-stone-800 px-5 py-1.5 hover:bg-stone-700 transition-colors"
                                        >
                                          保存する
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingSectionMediaId(null)}
                                          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-1.5 hover:border-stone-500 transition-colors"
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
                        <button
                          type="button"
                          onClick={() => { pendingSectionMedia.current = { sectionId: sec.id, sectionType: sec.section_type }; sectionMediaFileRef.current?.click(); }}
                          disabled={uploadingSectionMedia}
                          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-4 py-1.5 hover:border-stone-500 transition-colors disabled:opacity-40"
                        >
                          {uploadingSectionMedia ? 'アップロード中...' : '+ メディアを追加'}
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1">画像: jpg/png/webp/gif（5MB以下）　動画: mp4/mov/webm（50MB以下）</p>
                      </div>
                    )}

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
      {/* ── 店舗ピックアップ管理 ── */}
      <div className="mt-10">
        <div className="mb-4">
          <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-1">Pick Up</p>
          <h2 className="text-base font-light tracking-wider text-stone-800">店舗ピックアップ管理</h2>
          <p className="text-xs text-stone-400 mt-0.5">店舗ページに表示するピックアップ画像・動画を管理します</p>
        </div>

        {loadingPickups ? (
          <p className="text-xs text-stone-400">読み込み中...</p>
        ) : (
          <div className="space-y-2 mb-4">
            {salonPickups.length === 0 && (
              <p className="text-xs text-stone-400">ピックアップはまだありません</p>
            )}
            {salonPickups.map((pickup, pi) => {
              const isEditingThis = editingPickupId === pickup.id;
              return (
                <div key={pickup.id} className="border border-stone-200 bg-white">
                  {/* 行ヘッダー */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    {/* サムネイル */}
                    <div className="w-14 h-10 bg-stone-100 overflow-hidden relative shrink-0">
                      {pickup.image_url ? (
                        pickup.media_type === 'video' ? (
                          <video
                            src={pickup.image_url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={pickup.image_url}
                            alt={pickup.alt ?? ''}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-[9px] text-stone-400">NO IMG</span>
                        </div>
                      )}
                    </div>
                    {/* ラベル */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700 truncate">{pickup.label ?? '（ラベルなし）'}</p>
                      {pickup.link_href && (
                        <p className="text-[10px] text-stone-400 truncate">{pickup.link_href}</p>
                      )}
                    </div>
                    {/* 操作ボタン */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => movePickup(pickup.id, 'up')} disabled={pi === 0} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↑</button>
                      <button type="button" onClick={() => movePickup(pickup.id, 'down')} disabled={pi === salonPickups.length - 1} className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 px-1">↓</button>
                      <button
                        type="button"
                        onClick={() => togglePickup(pickup)}
                        className={`text-[10px] px-2 py-0.5 border transition-colors ${pickup.is_active ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-500 border-stone-300 hover:border-stone-500'}`}
                      >
                        {pickup.is_active ? '公開' : '非表示'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingThis) {
                            setEditingPickupId(null);
                          } else {
                            setEditingPickupId(pickup.id);
                            setPickupMeta({
                              label: pickup.label ?? '',
                              alt: pickup.alt ?? '',
                              link_href: pickup.link_href ?? '',
                            });
                          }
                        }}
                        className="text-xs tracking-wider text-stone-600 border border-stone-300 px-2 py-0.5 hover:border-stone-500 transition-colors"
                      >
                        {isEditingThis ? '閉じる' : '編集'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePickup(pickup)}
                        className="text-[10px] text-red-400 border border-red-200 px-2 py-0.5 hover:border-red-400 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {/* インライン編集フォーム */}
                  {isEditingThis && (
                    <div className="border-t border-stone-200 p-4 space-y-3 bg-stone-50">
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-1">ラベル</label>
                        <input
                          type="text"
                          value={pickupMeta.label}
                          onChange={e => setPickupMeta(prev => ({ ...prev, label: e.target.value }))}
                          className="w-full text-xs text-stone-700 border border-stone-200 p-2 focus:outline-none focus:border-stone-400"
                          placeholder="例：髪質改善"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-1">alt テキスト</label>
                        <input
                          type="text"
                          value={pickupMeta.alt}
                          onChange={e => setPickupMeta(prev => ({ ...prev, alt: e.target.value }))}
                          className="w-full text-xs text-stone-700 border border-stone-200 p-2 focus:outline-none focus:border-stone-400"
                          placeholder="画像の説明文"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-1">リンク URL</label>
                        <input
                          type="text"
                          value={pickupMeta.link_href}
                          onChange={e => setPickupMeta(prev => ({ ...prev, link_href: e.target.value }))}
                          className="w-full text-xs text-stone-700 border border-stone-200 p-2 focus:outline-none focus:border-stone-400"
                          placeholder="https://... または /menu/color など"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => savePickupMeta(pickup)}
                          className="text-xs tracking-wider text-white bg-stone-800 px-5 py-1.5 hover:bg-stone-700 transition-colors"
                        >
                          保存する
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPickupId(null)}
                          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-1.5 hover:border-stone-500 transition-colors"
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

        <button
          type="button"
          onClick={() => salonPickupFileRef.current?.click()}
          disabled={uploadingPickup}
          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-4 py-1.5 hover:border-stone-500 transition-colors disabled:opacity-40"
        >
          {uploadingPickup ? 'アップロード中...' : '+ ピックアップを追加'}
        </button>
        <p className="text-[10px] text-stone-400 mt-1">画像: jpg/png/webp/gif（5MB以下）　動画: mp4/mov/webm（50MB以下）</p>
      </div>
    </div>
  );
}
