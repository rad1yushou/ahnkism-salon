'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// ============================================================
// メディア定数
// ============================================================
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

// ============================================================
// 型定義
// ============================================================
type Menu = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  long_description: string | null;
  price: string | null;
  duration: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_aspect: 'video' | 'portrait' | 'square';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  sort_order: number;
  is_active: boolean;
};

type EditForm = {
  name: string;
  short_name: string | null;
  description: string | null;
  long_description: string | null;
  price: string | null;
  duration: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_aspect: 'video' | 'portrait' | 'square';
  media_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  sort_order: number;
  is_active: boolean;
};

type NewForm = {
  slug: string;
  name: string;
  short_name: string;
  description: string;
  long_description: string;
  price: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
};

type Faq = {
  id: string;
  menu_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

type FaqForm = {
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FAQ_FORM: FaqForm = {
  question: '',
  answer: '',
  sort_order: 0,
  is_active: true,
};

function toEditForm(menu: Menu): EditForm {
  return {
    name: menu.name,
    short_name: menu.short_name,
    description: menu.description,
    long_description: menu.long_description,
    price: menu.price,
    duration: menu.duration,
    media_url: menu.media_url,
    media_type: menu.media_type,
    media_aspect: menu.media_aspect,
    media_position: menu.media_position,
    sort_order: menu.sort_order,
    is_active: menu.is_active,
  };
}

function parseFeaturedCount(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(Math.max(Math.round(n), 1), 12);
}

// ============================================================
// 共通コンポーネント
// ============================================================
function Field({
  label, value, onChange, placeholder, required, type = 'text', rows,
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

// ============================================================
// メインページ
// ============================================================
export default function AdminMenusPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const [featuredCount, setFeaturedCount] = useState<number>(6);
  const [featuredCountInput, setFeaturedCountInput] = useState<string>('6');
  const [savingCount, setSavingCount] = useState(false);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<NewForm | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  // FAQ state（編集中メニューに紐づく）
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<FaqForm | null>(null);
  const [isAddingNewFaq, setIsAddingNewFaq] = useState(false);
  const [newFaqForm, setNewFaqForm] = useState<FaqForm>({ ...EMPTY_FAQ_FORM });
  const [savingFaq, setSavingFaq] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // ── データ読み込み ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const [menusRes, settingsRes] = await Promise.all([
      supabase
        .from('menus')
        .select('id, slug, name, short_name, description, long_description, price, duration, media_url, media_type, media_aspect, media_position, sort_order, is_active')
        .order('sort_order', { ascending: true }),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_menu_count')
        .maybeSingle(),
    ]);

    if (menusRes.error) {
      showMessage(`取得失敗: ${menusRes.error.message}`);
    } else {
      setMenus(
        (menusRes.data ?? []).map(m => ({
          ...m,
          media_url: m.media_url ?? null,
          media_type: (m.media_type ?? null) as 'image' | 'video' | null,
          media_aspect: (m.media_aspect ?? 'video') as 'video' | 'portrait' | 'square',
          media_position: (m.media_position ?? 'center') as 'center' | 'top' | 'bottom' | 'left' | 'right',
        }))
      );
    }

    const count = parseFeaturedCount(settingsRes.data?.value);
    setFeaturedCount(count);
    setFeaturedCountInput(String(count));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── FAQ 読み込み ─────────────────────────────────────────
  const loadFaqs = useCallback(async (menuId: string) => {
    if (!supabase) return;
    setLoadingFaqs(true);
    const { data, error } = await supabase
      .from('menu_faqs')
      .select('id, menu_id, question, answer, sort_order, is_active')
      .eq('menu_id', menuId)
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`FAQ取得失敗: ${error.message}`);
    } else {
      setFaqs(data ?? []);
    }
    setLoadingFaqs(false);
  }, [supabase]);

  // ── 既存メニュー編集 ──────────────────────────────────────
  const startEdit = (menu: Menu) => {
    setIsAddingNew(false);
    setNewForm(null);
    setEditingId(menu.id);
    setForm(toEditForm(menu));
    setFaqs([]);
    setEditingFaqId(null);
    setFaqForm(null);
    setIsAddingNewFaq(false);
    setNewFaqForm({ ...EMPTY_FAQ_FORM });
    loadFaqs(menu.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
    setFaqs([]);
    setEditingFaqId(null);
    setFaqForm(null);
    setIsAddingNewFaq(false);
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const saveEdit = async (menuId: string) => {
    if (!supabase || !form) return;
    setSaving(true);
    const { error } = await supabase
      .from('menus')
      .update({
        name: form.name,
        short_name: form.short_name || null,
        description: form.description || null,
        long_description: form.long_description || null,
        price: form.price || null,
        duration: form.duration || null,
        media_aspect: form.media_aspect,
        media_position: form.media_position,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', menuId);
    setSaving(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEdit();
    await loadData();
  };

  const toggleActive = async (menu: Menu) => {
    if (!supabase) return;
    await supabase.from('menus').update({ is_active: !menu.is_active }).eq('id', menu.id);
    await loadData();
  };

  // ── メディアアップロード ──────────────────────────────────
  const uploadMedia = async (file: File, menu: Menu) => {
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
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `menus/${menu.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (menu.media_url) {
        const oldPath = extractStoragePath(menu.media_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const { error: dbErr } = await supabase
        .from('menus')
        .update({ media_url: publicUrl, media_type: mediaType })
        .eq('id', menu.id);
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      setField('media_url', publicUrl);
      setField('media_type', mediaType);
      showMessage('メディアをアップロードしました');
      await loadData();
    } finally {
      setUploading(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const deleteMedia = async (menu: Menu) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    if (menu.media_url) {
      const path = extractStoragePath(menu.media_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase
      .from('menus')
      .update({ media_url: null, media_type: null })
      .eq('id', menu.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    setField('media_url', null);
    setField('media_type', null);
    showMessage('メディアを削除しました');
    await loadData();
  };

  // ── FAQ 操作 ─────────────────────────────────────────────
  const startEditFaq = (faq: Faq) => {
    setIsAddingNewFaq(false);
    setEditingFaqId(faq.id);
    setFaqForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: faq.is_active });
  };

  const cancelEditFaq = () => { setEditingFaqId(null); setFaqForm(null); };

  const saveEditFaq = async (faqId: string) => {
    if (!supabase || !faqForm) return;
    if (!faqForm.question.trim()) { showMessage('質問を入力してください'); return; }
    if (!faqForm.answer.trim()) { showMessage('答えを入力してください'); return; }
    setSavingFaq(true);
    const { error } = await supabase
      .from('menu_faqs')
      .update({ question: faqForm.question, answer: faqForm.answer, sort_order: faqForm.sort_order, is_active: faqForm.is_active })
      .eq('id', faqId);
    setSavingFaq(false);
    if (error) { showMessage(`FAQ保存失敗: ${error.message}`); return; }
    showMessage('FAQを保存しました');
    cancelEditFaq();
    if (editingId) await loadFaqs(editingId);
  };

  const addFaq = async (menuId: string) => {
    if (!supabase) return;
    if (!newFaqForm.question.trim()) { showMessage('質問を入力してください'); return; }
    if (!newFaqForm.answer.trim()) { showMessage('答えを入力してください'); return; }
    setSavingFaq(true);
    const maxSort = faqs.length > 0 ? Math.max(...faqs.map(f => f.sort_order)) + 1 : 1;
    const { error } = await supabase
      .from('menu_faqs')
      .insert({ menu_id: menuId, question: newFaqForm.question, answer: newFaqForm.answer, sort_order: maxSort, is_active: newFaqForm.is_active });
    setSavingFaq(false);
    if (error) { showMessage(`FAQ追加失敗: ${error.message}`); return; }
    showMessage('FAQを追加しました');
    setIsAddingNewFaq(false);
    setNewFaqForm({ ...EMPTY_FAQ_FORM });
    await loadFaqs(menuId);
  };

  const deleteFaq = async (faq: Faq) => {
    if (!supabase) return;
    if (!window.confirm('このFAQを削除しますか？')) return;
    const { error } = await supabase.from('menu_faqs').delete().eq('id', faq.id);
    if (error) { showMessage(`FAQ削除失敗: ${error.message}`); return; }
    showMessage('FAQを削除しました');
    if (editingFaqId === faq.id) cancelEditFaq();
    if (editingId) await loadFaqs(editingId);
  };

  const toggleActiveFaq = async (faq: Faq) => {
    if (!supabase) return;
    await supabase.from('menu_faqs').update({ is_active: !faq.is_active }).eq('id', faq.id);
    if (editingId) await loadFaqs(editingId);
  };

  const moveFaq = async (faqId: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = faqs.findIndex(f => f.id === faqId);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const a = faqs[idx];
    const b = faqs[targetIdx];
    await Promise.all([
      supabase.from('menu_faqs').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('menu_faqs').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    if (editingId) await loadFaqs(editingId);
  };

  // ── 表示件数設定 ─────────────────────────────────────────
  const saveFeaturedCount = async () => {
    if (!supabase) return;
    const n = parseFeaturedCount(featuredCountInput);
    setSavingCount(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'featured_menu_count', value: String(n) }, { onConflict: 'key' });
    setSavingCount(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    setFeaturedCount(n);
    setFeaturedCountInput(String(n));
    showMessage(`人気メニュー表示件数を ${n} 件に設定しました`);
  };

  // ── 新規メニュー追加 ─────────────────────────────────────
  const openAddNew = () => {
    cancelEdit();
    const maxOrder = menus.length > 0 ? Math.max(...menus.map(m => m.sort_order)) : 0;
    setNewForm({
      slug: '', name: '', short_name: '', description: '', long_description: '',
      price: '', duration: '', sort_order: maxOrder + 1, is_active: true,
    });
    setIsAddingNew(true);
  };

  const cancelAddNew = () => { setIsAddingNew(false); setNewForm(null); };

  const setNewField = <K extends keyof NewForm>(key: K, value: NewForm[K]) => {
    setNewForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const addMenu = async () => {
    if (!supabase || !newForm) return;
    if (!newForm.slug.trim()) { showMessage('slug を入力してください'); return; }
    if (!/^[a-z0-9-]+$/.test(newForm.slug)) { showMessage('slug は英小文字・数字・ハイフンのみ使用できます'); return; }
    if (!newForm.name.trim()) { showMessage('メニュー名を入力してください'); return; }
    if (menus.some(m => m.slug === newForm.slug.trim())) { showMessage(`slug "${newForm.slug}" はすでに存在します`); return; }
    setSavingNew(true);
    const { error } = await supabase.from('menus').insert({
      slug: newForm.slug.trim(),
      name: newForm.name.trim(),
      short_name: newForm.short_name.trim() || null,
      description: newForm.description.trim() || null,
      long_description: newForm.long_description.trim() || null,
      price: newForm.price.trim() || null,
      duration: newForm.duration.trim() || null,
      sort_order: newForm.sort_order,
      is_active: newForm.is_active,
    });
    setSavingNew(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`"${newForm.name}" を追加しました`);
    cancelAddNew();
    await loadData();
  };

  // ============================================================
  // レンダー
  // ============================================================
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">メニュー管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          メニュー情報を編集します。slug はURLに影響するため変更できません。
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

      {/* ── 表示設定 ── */}
      <section className="bg-white border border-stone-200 rounded-lg px-5 py-4">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider mb-4">表示設定</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
              トップページ 人気メニュー表示件数
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={12} value={featuredCountInput}
                onChange={e => setFeaturedCountInput(e.target.value)}
                disabled={!isConfigured}
                className="w-20 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white disabled:bg-stone-50"
              />
              <span className="text-xs text-stone-400">件（1〜12）</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">現在の設定: {featuredCount} 件</p>
          </div>
          <button
            onClick={saveFeaturedCount}
            disabled={!isConfigured || savingCount}
            className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
          >
            {savingCount ? '保存中...' : '保存'}
          </button>
        </div>
      </section>

      {/* ── 新規追加ボタン ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-stone-700 tracking-wider">メニュー一覧</h2>
        <button
          onClick={isAddingNew ? cancelAddNew : openAddNew}
          disabled={!isConfigured}
          className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-40 ${
            isAddingNew
              ? 'border-stone-300 text-stone-500 hover:bg-stone-50'
              : 'border-stone-400 text-stone-600 hover:bg-stone-50'
          }`}
        >
          {isAddingNew ? '✕ キャンセル' : '＋ 新規メニューを追加'}
        </button>
      </div>

      {/* ── 新規追加フォーム ── */}
      {isAddingNew && newForm && (
        <section className="bg-white border border-stone-300 border-dashed rounded-lg px-5 py-5 space-y-5">
          <p className="text-xs font-medium text-stone-700 tracking-wider">新規メニューを追加</p>
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
                  slug<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text" value={newForm.slug}
                  onChange={e => setNewField('slug', e.target.value.toLowerCase())}
                  placeholder="new-menu"
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">英小文字・数字・ハイフンのみ</p>
              </div>
              <Field label="メニュー名" value={newForm.name} onChange={v => setNewField('name', v)} placeholder="髪質改善トリートメント" required />
            </div>
            <div className="mt-3">
              <Field label="短縮名" value={newForm.short_name} onChange={v => setNewField('short_name', v)} placeholder="髪質改善" />
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">説明文</p>
            <div className="space-y-3">
              <Field label="短い説明（一覧・SEO用）" value={newForm.description} onChange={v => setNewField('description', v)} placeholder="大阪・心斎橋のAHNKISMが提供する..." rows={2} />
              <Field label="詳細説明（詳細ページ用）" value={newForm.long_description} onChange={v => setNewField('long_description', v)} placeholder="ダメージを補修しながら..." rows={4} />
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">料金・所要時間</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="料金" value={newForm.price} onChange={v => setNewField('price', v)} placeholder="¥15,000〜" />
              <Field label="所要時間" value={newForm.duration} onChange={v => setNewField('duration', v)} placeholder="約2〜3時間" />
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
            <div className="flex items-center gap-4">
              <Field label="表示順 (sort_order)" value={newForm.sort_order} onChange={v => setNewField('sort_order', Number(v))} placeholder="7" type="number" />
              <div className="flex items-center gap-2 pt-5">
                <input id="new-active" type="checkbox" checked={newForm.is_active} onChange={e => setNewField('is_active', e.target.checked)} className="rounded border-stone-300" />
                <label htmlFor="new-active" className="text-xs text-stone-600 whitespace-nowrap">公開する</label>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ※ 追加後、詳細ページ /menu/&#123;slug&#125; は動的ルート未対応のため 404 になります。一覧・トップページには反映されます。
          </p>
          <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
            <button onClick={addMenu} disabled={!isConfigured || savingNew} className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40">
              {savingNew ? '保存中...' : '追加する'}
            </button>
            <button onClick={cancelAddNew} className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors">
              キャンセル
            </button>
          </div>
        </section>
      )}

      {/* ── メニュー一覧 ── */}
      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : menus.length === 0 ? (
        <p className="text-xs text-stone-400">メニューデータがありません</p>
      ) : (
        <div className="space-y-4">
          {/* hidden file input（編集中メニュー共通） */}
          <input
            ref={mediaFileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
            className="hidden"
            disabled={!isConfigured || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              const menu = menus.find(m => m.id === editingId);
              if (file && menu) uploadMedia(file, menu);
            }}
          />

          {menus.map(menu => (
            <section key={menu.id} className="bg-white border border-stone-200 rounded-lg">

              {/* ── カードヘッダー ── */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                    menu.is_active ? 'bg-green-500' : 'bg-stone-400'
                  }`}>
                    {menu.is_active ? '公開中' : '非表示中'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800 tracking-wide">{menu.name}</p>
                    <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                      slug: <span className="font-mono">{menu.slug}</span>
                      　sort: {menu.sort_order}
                      {menu.media_type && `　${menu.media_type}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(menu)} disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      menu.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {menu.is_active ? '表示中' : '非表示'}
                  </button>
                  {editingId === menu.id ? (
                    <button onClick={cancelEdit} className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors">
                      ✕ 閉じる
                    </button>
                  ) : (
                    <button onClick={() => startEdit(menu)} disabled={!isConfigured} className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40">
                      編集
                    </button>
                  )}
                </div>
              </div>

              {/* ── 編集フォーム ── */}
              {editingId === menu.id && form && (
                <div className="border-t border-stone-100 px-5 py-5 space-y-6">

                  {/* 基本情報 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="メニュー名" value={form.name} onChange={v => setField('name', v)} placeholder="髪質改善トリートメント" required />
                      <Field label="短縮名" value={form.short_name} onChange={v => setField('short_name', v)} placeholder="髪質改善" />
                    </div>
                  </div>

                  {/* 説明文 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">説明文</p>
                    <div className="space-y-3">
                      <Field label="短い説明（一覧・SEO用）" value={form.description} onChange={v => setField('description', v)} placeholder="大阪・心斎橋のAHNKISMが提供する..." rows={2} />
                      <Field label="詳細説明（詳細ページ用）" value={form.long_description} onChange={v => setField('long_description', v)} placeholder="ダメージを補修しながら..." rows={4} />
                    </div>
                  </div>

                  {/* 料金・所要時間 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">料金・所要時間</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="料金" value={form.price} onChange={v => setField('price', v)} placeholder="¥15,000〜" />
                      <Field label="所要時間" value={form.duration} onChange={v => setField('duration', v)} placeholder="約2〜3時間" />
                    </div>
                  </div>

                  {/* 画像 / 動画 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">画像 / 動画（詳細ページ）</p>
                    {form.media_url && (
                      <div className="mb-3">
                        <div className="w-full aspect-video bg-stone-100 rounded overflow-hidden relative mb-2">
                          {form.media_type === 'video' ? (
                            <video src={form.media_url} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <Image src={form.media_url} alt={form.name ?? ''} fill className="object-cover" unoptimized />
                          )}
                        </div>
                        <button
                          onClick={() => deleteMedia(menu)} disabled={!isConfigured || uploading}
                          className="text-[10px] py-1 px-2 border border-red-300 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                        >
                          メディアを削除
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => mediaFileRef.current?.click()} disabled={!isConfigured || uploading}
                      className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                    >
                      {uploading ? 'アップロード中...' : form.media_url ? 'メディアを差し替え' : 'メディアをアップロード'}
                    </button>
                    <p className="text-[10px] text-stone-400 mt-1">
                      jpg / png / webp / gif（5MB以下）、mp4 / mov / webm（50MB以下）
                    </p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-2">画像比率</label>
                        <div className="flex gap-6">
                          {([
                            { value: 'video', label: '16:9（横長）' },
                            { value: 'portrait', label: '4:5（縦長）' },
                            { value: 'square', label: '1:1（正方形）' },
                          ] as const).map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                              <input
                                type="radio"
                                name={`media_aspect_${menu.id}`}
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
                      <div>
                        <label className="block text-[10px] tracking-widest text-stone-500 mb-2">画像の表示位置</label>
                        <select
                          value={form.media_position}
                          onChange={e => setField('media_position', e.target.value as EditForm['media_position'])}
                          className="border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
                        >
                          <option value="center">中央</option>
                          <option value="top">上</option>
                          <option value="bottom">下</option>
                          <option value="left">左</option>
                          <option value="right">右</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 表示設定 */}
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
                    <div className="flex items-center gap-4">
                      <Field label="表示順 (sort_order)" value={form.sort_order} onChange={v => setField('sort_order', Number(v))} placeholder="1" type="number" />
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          id={`active-${menu.id}`} type="checkbox" checked={form.is_active}
                          onChange={e => setField('is_active', e.target.checked)} className="rounded border-stone-300"
                        />
                        <label htmlFor={`active-${menu.id}`} className="text-xs text-stone-600 whitespace-nowrap">公開する</label>
                      </div>
                    </div>
                  </div>

                  {/* 保存・キャンセル */}
                  <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <button onClick={() => saveEdit(menu.id)} disabled={!isConfigured || saving} className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40">
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors">
                      キャンセル
                    </button>
                  </div>

                  {/* ── FAQ管理 ── */}
                  <div className="border-t border-stone-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] tracking-widest text-stone-400 uppercase">よくある質問（FAQ）</p>
                      {!isAddingNewFaq && (
                        <button
                          onClick={() => { setIsAddingNewFaq(true); setEditingFaqId(null); setFaqForm(null); }}
                          disabled={!isConfigured}
                          className="text-[10px] px-2 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                        >
                          + FAQ を追加
                        </button>
                      )}
                    </div>

                    {/* 新規FAQ追加フォーム */}
                    {isAddingNewFaq && (
                      <div className="bg-stone-50 border border-stone-200 rounded p-4 mb-4 space-y-3">
                        <p className="text-[10px] tracking-widest text-stone-500 uppercase">新規FAQ</p>
                        <Field label="質問" value={newFaqForm.question} onChange={v => setNewFaqForm(p => ({ ...p, question: v }))} placeholder="施術にどのくらい時間がかかりますか？" required rows={2} />
                        <Field label="答え" value={newFaqForm.answer} onChange={v => setNewFaqForm(p => ({ ...p, answer: v }))} placeholder="初回は約〇時間程度です。" required rows={3} />
                        <div className="flex items-center gap-2">
                          <input
                            id={`new-faq-active-${menu.id}`} type="checkbox" checked={newFaqForm.is_active}
                            onChange={e => setNewFaqForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-stone-300"
                          />
                          <label htmlFor={`new-faq-active-${menu.id}`} className="text-xs text-stone-600">公開する</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addFaq(menu.id)} disabled={!isConfigured || savingFaq}
                            className="px-3 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                          >
                            {savingFaq ? '追加中...' : '追加する'}
                          </button>
                          <button
                            onClick={() => { setIsAddingNewFaq(false); setNewFaqForm({ ...EMPTY_FAQ_FORM }); }}
                            className="px-3 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FAQリスト */}
                    {loadingFaqs ? (
                      <p className="text-[10px] text-stone-400">読み込み中...</p>
                    ) : faqs.length === 0 ? (
                      <p className="text-[10px] text-stone-400">FAQがありません。「+ FAQ を追加」から追加してください。</p>
                    ) : (
                      <div className="space-y-2">
                        {faqs.map((faq, fi) => (
                          <div key={faq.id} className="border border-stone-200 rounded bg-white">
                            <div className="flex items-start justify-between px-4 py-3 gap-3">
                              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${faq.is_active ? 'bg-green-500' : 'bg-stone-400'}`}>
                                  {faq.is_active ? '公開' : '非公開'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-stone-700 font-medium truncate">Q. {faq.question}</p>
                                {editingFaqId !== faq.id && (
                                  <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">A. {faq.answer}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => moveFaq(faq.id, 'up')} disabled={!isConfigured || fi === 0}
                                  className="text-[10px] px-1.5 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                                >↑</button>
                                <button
                                  onClick={() => moveFaq(faq.id, 'down')} disabled={!isConfigured || fi === faqs.length - 1}
                                  className="text-[10px] px-1.5 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                                >↓</button>
                                <button
                                  onClick={() => toggleActiveFaq(faq)} disabled={!isConfigured}
                                  className={`text-[10px] px-1.5 py-1 rounded border transition-colors disabled:opacity-40 ${
                                    faq.is_active
                                      ? 'border-green-400 text-green-600 hover:bg-green-50'
                                      : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                                  }`}
                                >
                                  {faq.is_active ? '公開中' : '非公開'}
                                </button>
                                {editingFaqId === faq.id ? (
                                  <button onClick={cancelEditFaq} className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors">
                                    閉じる
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => startEditFaq(faq)} disabled={!isConfigured}
                                    className="text-[10px] px-2 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                                  >
                                    編集
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteFaq(faq)} disabled={!isConfigured}
                                  className="text-[10px] px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                >
                                  削除
                                </button>
                              </div>
                            </div>

                            {/* FAQ編集フォーム */}
                            {editingFaqId === faq.id && faqForm && (
                              <div className="border-t border-stone-100 px-4 py-3 space-y-3">
                                <Field label="質問" value={faqForm.question} onChange={v => setFaqForm(p => p ? { ...p, question: v } : p)} placeholder="施術にどのくらい時間がかかりますか？" required rows={2} />
                                <Field label="答え" value={faqForm.answer} onChange={v => setFaqForm(p => p ? { ...p, answer: v } : p)} placeholder="初回は約〇時間程度です。" required rows={3} />
                                <div className="flex items-center gap-2">
                                  <input
                                    id={`faq-active-${faq.id}`} type="checkbox" checked={faqForm.is_active}
                                    onChange={e => setFaqForm(p => p ? { ...p, is_active: e.target.checked } : p)} className="rounded border-stone-300"
                                  />
                                  <label htmlFor={`faq-active-${faq.id}`} className="text-xs text-stone-600">公開する</label>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEditFaq(faq.id)} disabled={!isConfigured || savingFaq}
                                    className="px-3 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                                  >
                                    {savingFaq ? '保存中...' : '保存'}
                                  </button>
                                  <button
                                    onClick={cancelEditFaq}
                                    className="px-3 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
