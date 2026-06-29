'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { SALONS } from '@/constants/salons';

const BUCKET = 'ahnkism-public';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

function generateSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = ascii || 'blog';
  return `${base}-${Date.now()}`;
}

// ── 型定義 ────────────────────────────────────────────────────────────────

type Blog = {
  id: string;
  salon_slug: string;
  author_name: string | null;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
};

type BlogForm = {
  author_name: string;
  category: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featured_image_url: string | null;
  is_published: boolean;
  sort_order: number;
};

type BlogMedia = {
  id: string;
  blog_id: string;
  media_url: string;
  media_type: string;
  title: string | null;
  description: string | null;
  alt: string | null;
  sort_order: number;
  is_active: boolean;
};

type MediaMetaForm = {
  title: string;
  description: string;
  alt: string;
  sort_order: number;
};

const EMPTY_FORM: BlogForm = {
  author_name: '',
  category: '',
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  featured_image_url: null,
  is_published: false,
  sort_order: 0,
};

function toBlogForm(b: Blog): BlogForm {
  return {
    author_name: b.author_name ?? '',
    category: b.category ?? '',
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt ?? '',
    body: b.body ?? '',
    featured_image_url: b.featured_image_url,
    is_published: b.is_published,
    sort_order: b.sort_order,
  };
}

// ── UI 部品 ───────────────────────────────────────────────────────────────

const baseInput =
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
  value: string | number | null;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={baseInput + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className={baseInput}
        />
      )}
    </div>
  );
}

// ── BlogMediaSection（本文画像 / ギャラリー） ────────────────────────────

function BlogMediaSection({
  blogId,
  salonSlug,
  showMessage,
}: {
  blogId: string;
  salonSlug: string;
  showMessage: (msg: string) => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaMetaForm, setMediaMetaForm] = useState<MediaMetaForm>({
    title: '', description: '', alt: '', sort_order: 0,
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    if (!supabase) return;
    setLoadingMedia(true);
    const { data } = await supabase
      .from('salon_blog_media')
      .select('id, blog_id, media_url, media_type, title, description, alt, sort_order, is_active')
      .eq('blog_id', blogId)
      .order('sort_order', { ascending: true });
    setMedia(data ?? []);
    setLoadingMedia(false);
  }, [supabase, blogId]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  const toggleActive = async (m: BlogMedia) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています'); return; }
    await supabase.from('salon_blog_media').update({ is_active: !m.is_active }).eq('id', m.id);
    await loadMedia();
  };

  const startEditMeta = (m: BlogMedia) => {
    setEditingMediaId(m.id);
    setMediaMetaForm({
      title: m.title ?? '',
      description: m.description ?? '',
      alt: m.alt ?? '',
      sort_order: m.sort_order,
    });
  };

  const saveMediaMeta = async (mediaId: string) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています'); return; }
    setSavingMeta(true);
    const { data: updated, error } = await supabase
      .from('salon_blog_media')
      .update({
        title: mediaMetaForm.title || null,
        description: mediaMetaForm.description || null,
        alt: mediaMetaForm.alt || null,
        sort_order: mediaMetaForm.sort_order,
      })
      .eq('id', mediaId)
      .select('id');
    setSavingMeta(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    if (!updated || updated.length === 0) { showMessage('保存できませんでした（RLS確認）'); return; }
    showMessage('メディア情報を保存しました');
    setEditingMediaId(null);
    await loadMedia();
  };

  const uploadNewMedia = async (file: File) => {
    if (!supabase) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      showMessage('jpg / png / webp / gif のみアップロードできます');
      return;
    }
    if (file.size > IMAGE_MAX_SIZE) {
      showMessage('画像は 5MB 以下にしてください');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています'); return; }

    setUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${salonSlug}/blog/${blogId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const nextSort = media.length > 0 ? Math.max(...media.map((m) => m.sort_order)) + 1 : 0;

      const { error: insertErr } = await supabase.from('salon_blog_media').insert({
        blog_id: blogId,
        media_url: publicUrl,
        media_type: 'image',
        sort_order: nextSort,
        is_active: true,
      });
      if (insertErr) { showMessage(`DB保存失敗: ${insertErr.message}`); return; }
      showMessage('画像を追加しました');
      await loadMedia();
    } finally {
      setUploadingMedia(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {loadingMedia && <span className="text-[10px] text-stone-300">読み込み中...</span>}
        <span className="text-[10px] text-stone-400">{media.length} 件</span>
      </div>

      {/* 画像一覧 */}
      {media.map((m) => (
        <div
          key={m.id}
          className={`border border-stone-200 rounded p-3 ${!m.is_active ? 'opacity-50' : ''}`}
        >
          <div className="flex gap-3">
            {/* サムネイル */}
            <div className="w-20 h-14 bg-stone-100 rounded overflow-hidden relative shrink-0">
              <Image src={m.media_url} alt={m.alt ?? ''} fill className="object-cover" unoptimized />
            </div>

            {/* 情報 + ボタン */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] text-stone-500 space-y-0.5 min-w-0">
                  {m.title && (
                    <p className="font-medium text-stone-700 truncate">{m.title}</p>
                  )}
                  {m.description && (
                    <p className="text-stone-400 line-clamp-1">{m.description}</p>
                  )}
                  <p className="text-stone-300">sort: {m.sort_order}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive(m)}
                    className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                      m.is_active
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {m.is_active ? '表示中' : '非表示'}
                  </button>
                  <button
                    onClick={() =>
                      editingMediaId === m.id
                        ? setEditingMediaId(null)
                        : startEditMeta(m)
                    }
                    className="text-[9px] px-2 py-0.5 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                  >
                    {editingMediaId === m.id ? '閉じる' : '編集'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* メタ情報編集 */}
          {editingMediaId === m.id && (
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="タイトル"
                  value={mediaMetaForm.title}
                  onChange={(v) => setMediaMetaForm((p) => ({ ...p, title: v }))}
                  placeholder="画像タイトル"
                />
                <Field
                  label="alt テキスト（SEO）"
                  value={mediaMetaForm.alt}
                  onChange={(v) => setMediaMetaForm((p) => ({ ...p, alt: v }))}
                  placeholder="画像の説明"
                />
              </div>
              <Field
                label="キャプション"
                value={mediaMetaForm.description}
                onChange={(v) => setMediaMetaForm((p) => ({ ...p, description: v }))}
                placeholder="画像の補足説明"
                rows={2}
              />
              <div className="w-24">
                <Field
                  label="表示順"
                  value={mediaMetaForm.sort_order}
                  onChange={(v) => setMediaMetaForm((p) => ({ ...p, sort_order: Number(v) }))}
                  type="number"
                />
              </div>
              <button
                onClick={() => saveMediaMeta(m.id)}
                disabled={savingMeta}
                className="text-[10px] px-3 py-1 rounded bg-stone-700 text-white hover:bg-stone-800 transition-colors disabled:opacity-40"
              >
                {savingMeta ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* 新規アップロード */}
      <input
        ref={mediaFileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        multiple
        className="hidden"
        disabled={uploadingMedia}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          for (const file of files) {
            await uploadNewMedia(file);
          }
        }}
      />
      <button
        onClick={() => mediaFileRef.current?.click()}
        disabled={uploadingMedia}
        className="text-[10px] py-1.5 px-3 border border-dashed border-stone-300 text-stone-500 hover:bg-stone-50 rounded transition-colors disabled:opacity-40 w-full text-center"
      >
        {uploadingMedia ? 'アップロード中...' : '+ 画像を追加（複数選択可）'}
      </button>
      <p className="text-[10px] text-stone-400">jpg / png / webp / gif（各 5MB 以下）</p>
    </div>
  );
}

// ── BlogFormFields ─────────────────────────────────────────────────────────

function BlogFormFields({
  form,
  onChange,
  imageRef,
  uploading,
  isConfigured,
  onUploadImage,
  onRemoveImage,
  blogId,
  salonSlug,
  showMessage,
}: {
  form: BlogForm;
  onChange: <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => void;
  imageRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  isConfigured: boolean;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  blogId?: string;
  salonSlug: string;
  showMessage: (msg: string) => void;
}) {
  return (
    <div className="space-y-7">
      {/* ── 基本情報 ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">基本情報</p>
        <div className="space-y-3">
          <Field
            label="タイトル"
            value={form.title}
            onChange={(v) => onChange('title', v)}
            placeholder="ブログ記事のタイトル"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="カテゴリ"
              value={form.category}
              onChange={(v) => onChange('category', v)}
              placeholder="ヘアケア・カラー など"
            />
            <Field
              label="著者名"
              value={form.author_name}
              onChange={(v) => onChange('author_name', v)}
              placeholder="スタイリスト名"
            />
          </div>
        </div>
      </div>

      {/* ── URL スラッグ ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">URL スラッグ</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => onChange('slug', e.target.value)}
            placeholder="空白で自動生成"
            className="flex-1 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
          />
          <button
            type="button"
            onClick={() => onChange('slug', generateSlug(form.title))}
            className="text-[10px] px-2 py-1 border border-stone-300 text-stone-500 hover:bg-stone-50 rounded transition-colors whitespace-nowrap"
          >
            タイトルから生成
          </button>
        </div>
        <p className="text-[10px] text-stone-400 mt-1">
          /salon/{salonSlug}/blog/{form.slug || '（保存時に生成）'}
        </p>
      </div>

      {/* ── アイキャッチ画像 ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">アイキャッチ画像</p>
        {form.featured_image_url && (
          <div className="mb-3">
            <div className="w-48 aspect-video bg-stone-100 rounded overflow-hidden relative mb-2">
              <Image
                src={form.featured_image_url}
                alt="アイキャッチ"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={onRemoveImage}
              disabled={!isConfigured || uploading}
              className="text-[10px] py-1 px-2 border border-stone-300 text-stone-500 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
            >
              画像を外す
            </button>
          </div>
        )}
        <input
          ref={imageRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          disabled={!isConfigured || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadImage(file);
            if (imageRef.current) imageRef.current.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          disabled={!isConfigured || uploading}
          className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
        >
          {uploading
            ? 'アップロード中...'
            : form.featured_image_url
            ? '差し替え'
            : '画像をアップロード'}
        </button>
        <p className="text-[10px] text-stone-400 mt-1">jpg / png / webp / gif（5MB以下）</p>
      </div>

      {/* ── 内容 ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">内容</p>
        <div className="space-y-3">
          <Field
            label="抜粋（一覧・OGP 用）"
            value={form.excerpt}
            onChange={(v) => onChange('excerpt', v)}
            placeholder="記事の要約（100〜200文字程度）"
            rows={2}
          />
          <Field
            label="本文"
            value={form.body}
            onChange={(v) => onChange('body', v)}
            placeholder="記事の本文を入力してください。"
            rows={10}
          />
        </div>
      </div>

      {/* ── 本文画像 / ギャラリー ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">
          本文画像 / ギャラリー
        </p>
        {blogId ? (
          <BlogMediaSection blogId={blogId} salonSlug={salonSlug} showMessage={showMessage} />
        ) : (
          <p className="text-[10px] text-stone-400">記事を保存した後に画像を追加できます。</p>
        )}
      </div>

      {/* ── 公開設定 ── */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">公開設定</p>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => onChange('is_published', e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-xs text-stone-600">公開する</span>
          </label>
          <div className="w-28">
            <Field
              label="表示順"
              value={form.sort_order}
              onChange={(v) => onChange('sort_order', Number(v))}
              type="number"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ───────────────────────────────────────────────────

export default function AdminBlogsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [selectedSalon, setSelectedSalon] = useState(SALONS[0].slug);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 新規投稿
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<BlogForm>({ ...EMPTY_FORM });
  const [savingNew, setSavingNew] = useState(false);
  const newImageRef = useRef<HTMLInputElement>(null);

  // 編集
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BlogForm | null>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  }, []);

  const loadBlogs = useCallback(
    async (salonSlug: string) => {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('salon_blogs')
        .select(
          'id, salon_slug, author_name, category, title, slug, excerpt, body, featured_image_url, is_published, published_at, sort_order, created_at',
        )
        .eq('salon_slug', salonSlug)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        showMessage(`取得失敗: ${error.message}`);
      } else {
        setBlogs(data ?? []);
      }
      setLoading(false);
    },
    [supabase, showMessage],
  );

  useEffect(() => {
    loadBlogs(selectedSalon);
    setIsAdding(false);
    setEditingId(null);
    setEditForm(null);
  }, [selectedSalon, loadBlogs]);

  // ── 新規 ──────────────────────────────────────────────────

  const openAddNew = () => {
    setEditingId(null);
    setEditForm(null);
    const maxSort = blogs.length > 0 ? Math.max(...blogs.map((b) => b.sort_order)) + 1 : 1;
    setNewForm({ ...EMPTY_FORM, sort_order: maxSort });
    setIsAdding(true);
  };

  const cancelAddNew = () => {
    setIsAdding(false);
    setNewForm({ ...EMPTY_FORM });
  };

  const addBlog = async () => {
    if (!supabase) return;
    if (!newForm.title.trim()) { showMessage('タイトルは必須です'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています'); return; }

    const slug = newForm.slug.trim() || generateSlug(newForm.title);
    const now = new Date().toISOString();
    const published_at = newForm.is_published ? now : null;

    setSavingNew(true);
    const { error } = await supabase.from('salon_blogs').insert({
      salon_slug: selectedSalon,
      author_name: newForm.author_name || null,
      category: newForm.category || null,
      title: newForm.title,
      slug,
      excerpt: newForm.excerpt || null,
      body: newForm.body || null,
      featured_image_url: newForm.featured_image_url,
      is_published: newForm.is_published,
      published_at,
      sort_order: newForm.sort_order,
    });
    setSavingNew(false);

    if (error) {
      showMessage(
        error.message.includes('unique')
          ? 'このスラッグはすでに使われています'
          : `追加失敗: ${error.message}`,
      );
      return;
    }
    showMessage(`「${newForm.title}」を保存しました`);
    cancelAddNew();
    await loadBlogs(selectedSalon);
  };

  // ── 編集 ──────────────────────────────────────────────────

  const startEdit = (b: Blog) => {
    setIsAdding(false);
    setEditingId(b.id);
    setEditForm(toBlogForm(b));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const setEditField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveEdit = async (blog: Blog) => {
    if (!supabase || !editForm) return;
    if (!editForm.title.trim()) { showMessage('タイトルは必須です'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています。再ログインしてください'); return; }

    const slug = editForm.slug.trim() || generateSlug(editForm.title);
    const now = new Date().toISOString();
    // 初めて公開する場合のみ published_at をセット
    const published_at = editForm.is_published && !blog.published_at ? now : blog.published_at;

    setSaving(true);
    const { data: updated, error } = await supabase
      .from('salon_blogs')
      .update({
        author_name: editForm.author_name || null,
        category: editForm.category || null,
        title: editForm.title,
        slug,
        excerpt: editForm.excerpt || null,
        body: editForm.body || null,
        featured_image_url: editForm.featured_image_url,
        is_published: editForm.is_published,
        published_at,
        sort_order: editForm.sort_order,
        updated_at: now,
      })
      .eq('id', blog.id)
      .select('id');
    setSaving(false);

    if (error) {
      showMessage(
        error.message.includes('unique')
          ? 'このスラッグはすでに使われています'
          : `保存失敗: ${error.message}`,
      );
      return;
    }
    if (!updated || updated.length === 0) {
      showMessage('保存できませんでした。権限を確認してください');
      return;
    }
    showMessage('保存しました');
    cancelEdit();
    await loadBlogs(selectedSalon);
  };

  // ── 公開トグル ────────────────────────────────────────────

  const togglePublished = async (blog: Blog) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showMessage('セッションが切れています'); return; }
    const now = new Date().toISOString();
    const is_published = !blog.is_published;
    const published_at = is_published && !blog.published_at ? now : blog.published_at;
    await supabase
      .from('salon_blogs')
      .update({ is_published, published_at, updated_at: now })
      .eq('id', blog.id);
    await loadBlogs(selectedSalon);
  };

  // ── アイキャッチ画像アップロード ─────────────────────────

  const uploadFeaturedImage = async (file: File, onSuccess: (url: string) => void) => {
    if (!supabase) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      showMessage('jpg / png / webp / gif のみアップロードできます');
      return;
    }
    if (file.size > IMAGE_MAX_SIZE) {
      showMessage('画像は 5MB 以下にしてください');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `salons/${selectedSalon}/blog/featured/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onSuccess(publicUrl);
      showMessage('アイキャッチ画像をアップロードしました');
    } finally {
      setUploading(false);
    }
  };

  // ── レンダー ──────────────────────────────────────────────

  const selectedSalonName = SALONS.find((s) => s.slug === selectedSalon)?.name ?? selectedSalon;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">ブログ管理</h1>
        <p className="text-xs text-stone-500 mt-1">各店舗のブログ記事を管理します。</p>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          ⚠️ Supabase の環境変数が設定されていません。
        </div>
      )}

      {message && (
        <div className="bg-stone-800 text-white text-sm px-4 py-2 rounded">{message}</div>
      )}

      {/* 店舗選択 */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-stone-500 tracking-widest whitespace-nowrap">店舗</label>
        <select
          value={selectedSalon}
          onChange={(e) => setSelectedSalon(e.target.value)}
          className="border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 bg-white focus:outline-none focus:border-stone-500"
        >
          {SALONS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-stone-400">{blogs.length} 件</span>
      </div>

      {/* 新規投稿 */}
      {!isAdding ? (
        <button
          onClick={openAddNew}
          disabled={!isConfigured}
          className="px-4 py-2 rounded border border-stone-400 text-stone-600 text-xs hover:bg-stone-100 transition-colors disabled:opacity-40"
        >
          + 新規投稿
        </button>
      ) : (
        <section className="bg-white border border-[#C9A96E] rounded-lg">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-800">
              新規投稿 — {selectedSalonName}
            </p>
            <button
              onClick={cancelAddNew}
              className="text-[10px] text-stone-400 hover:text-stone-600"
            >
              ✕ 閉じる
            </button>
          </div>
          <div className="px-5 py-5">
            <BlogFormFields
              form={newForm}
              onChange={(key, value) => setNewForm((prev) => ({ ...prev, [key]: value }))}
              imageRef={newImageRef as React.RefObject<HTMLInputElement>}
              uploading={uploading}
              isConfigured={isConfigured}
              onUploadImage={(file) =>
                uploadFeaturedImage(file, (url) =>
                  setNewForm((prev) => ({ ...prev, featured_image_url: url })),
                )
              }
              onRemoveImage={() => setNewForm((prev) => ({ ...prev, featured_image_url: null }))}
              salonSlug={selectedSalon}
              showMessage={showMessage}
            />
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-stone-100">
              <button
                onClick={addBlog}
                disabled={!isConfigured || savingNew}
                className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
              >
                {savingNew ? '保存中...' : '投稿を保存'}
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

      {/* ブログ一覧 */}
      {loading ? (
        <p className="text-xs text-stone-400">読み込み中...</p>
      ) : blogs.length === 0 ? (
        <p className="text-xs text-stone-400">投稿がありません</p>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <section
              key={blog.id}
              className={`bg-white border border-stone-200 rounded-lg ${!blog.is_published ? 'opacity-80' : ''}`}
            >
              {/* カードヘッダー */}
              <div className="flex items-start justify-between px-5 py-4 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                      blog.is_published ? 'bg-green-500' : 'bg-stone-400'
                    }`}
                  >
                    {blog.is_published ? '公開中' : '下書き'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 tracking-wide truncate">
                      {blog.title}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {blog.slug}
                      {blog.category && `　#${blog.category}`}
                      {blog.published_at &&
                        `　${new Date(blog.published_at).toLocaleDateString('ja-JP')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* 公開トグル */}
                  <button
                    onClick={() => togglePublished(blog)}
                    disabled={!isConfigured}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                      blog.is_published
                        ? 'border-green-400 text-green-600 hover:bg-green-50'
                        : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {blog.is_published ? '公開中' : '下書き'}
                  </button>
                  {/* 編集 */}
                  {editingId === blog.id ? (
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      ✕ 閉じる
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(blog)}
                      disabled={!isConfigured}
                      className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>

              {/* 編集フォーム */}
              {editingId === blog.id && editForm && (
                <div className="border-t border-stone-100 px-5 py-5">
                  <BlogFormFields
                    form={editForm}
                    onChange={setEditField}
                    imageRef={editImageRef as React.RefObject<HTMLInputElement>}
                    uploading={uploading}
                    isConfigured={isConfigured}
                    onUploadImage={(file) =>
                      uploadFeaturedImage(file, (url) => setEditField('featured_image_url', url))
                    }
                    onRemoveImage={() => setEditField('featured_image_url', null)}
                    blogId={blog.id}
                    salonSlug={selectedSalon}
                    showMessage={showMessage}
                  />
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-stone-100">
                    <button
                      onClick={() => saveEdit(blog)}
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
