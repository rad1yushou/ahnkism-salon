'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const BUCKET = 'ahnkism-public';
const SALON_SLUGS = ['labo', 'nit', 'elu', 'olea'] as const;
type SalonSlug = typeof SALON_SLUGS[number];
const SALON_LABELS: Record<SalonSlug, string> = {
  labo: 'LABO',
  nit:  'nit',
  elu:  'ELU',
  olea: 'Olea',
};
const BLOG_ASPECT_OPTIONS = ['4:3', '3:4', '1:1', '16:9', '9:16'] as const;

type Blog = {
  id: string;
  salon_slug: string;
  title: string;
  category: string | null;
  author_name: string | null;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  featured_image_aspect: string;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
};

type BlogMedia = {
  id: string;
  blog_id: string;
  media_url: string;
  title: string | null;
  description: string | null;
  alt: string | null;
  sort_order: number;
  is_active: boolean;
  media_aspect: string;
};

type BlogForm = {
  title: string;
  category: string;
  author_name: string;
  excerpt: string;
  body: string;
  featured_image_url: string | null;
  featured_image_aspect: string;
  is_published: boolean;
  published_at: string;
  sort_order: number;
};

const EMPTY_BLOG_FORM: BlogForm = {
  title: '',
  category: '',
  author_name: '',
  excerpt: '',
  body: '',
  featured_image_url: null,
  featured_image_aspect: '4:3',
  is_published: false,
  published_at: '',
  sort_order: 0,
};

export default function AdminBlogsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [selectedSlug, setSelectedSlug] = useState<SalonSlug>('labo');
  const [message, setMessage] = useState('');

  // ── ブログ state ──
  const [salonBlogs, setSalonBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<BlogForm | null>(null);
  const [savingBlog, setSavingBlog] = useState(false);
  const [addingBlog, setAddingBlog] = useState(false);
  const [newBlogForm, setNewBlogForm] = useState<BlogForm>({ ...EMPTY_BLOG_FORM });
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);
  const [blogMedia, setBlogMedia] = useState<BlogMedia[]>([]);
  const [loadingBlogMedia, setLoadingBlogMedia] = useState(false);
  const [uploadingBlogMedia, setUploadingBlogMedia] = useState(false);
  const [editingBlogMediaId, setEditingBlogMediaId] = useState<string | null>(null);
  const [blogMediaMeta, setBlogMediaMeta] = useState<{
    title: string; description: string; alt: string; sort_order: number; media_aspect: string;
  }>({ title: '', description: '', alt: '', sort_order: 0, media_aspect: '4:3' });

  const blogImageRef = useRef<HTMLInputElement>(null);
  const blogMediaFileRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // ── データ読み込み ──
  const loadBlogs = useCallback(async (slug: string) => {
    if (!supabase) return;
    setLoadingBlogs(true);
    const { data, error } = await supabase
      .from('salon_blogs')
      .select('id, salon_slug, title, category, author_name, excerpt, body, featured_image_url, featured_image_aspect, is_published, published_at, sort_order, created_at')
      .eq('salon_slug', slug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setLoadingBlogs(false);
    if (error) { showMessage(`ブログ読み込み失敗: ${error.message}`); return; }
    setSalonBlogs((data ?? []) as Blog[]);
  }, [supabase]);

  const loadBlogMedia = useCallback(async (blogId: string) => {
    if (!supabase) return;
    setLoadingBlogMedia(true);
    const { data } = await supabase
      .from('salon_blog_media')
      .select('id, blog_id, media_url, title, description, alt, sort_order, is_active, media_aspect')
      .eq('blog_id', blogId)
      .order('sort_order', { ascending: true });
    setBlogMedia((data ?? []) as BlogMedia[]);
    setLoadingBlogMedia(false);
  }, [supabase]);

  useEffect(() => {
    setEditingBlogId(null);
    setBlogForm(null);
    setAddingBlog(false);
    setNewBlogForm({ ...EMPTY_BLOG_FORM });
    loadBlogs(selectedSlug);
  }, [selectedSlug, loadBlogs]);

  useEffect(() => {
    if (editingBlogId) {
      loadBlogMedia(editingBlogId);
    } else {
      setBlogMedia([]);
    }
  }, [editingBlogId, loadBlogMedia]);

  // ── ユーティリティ ──
  const toIso = (datetimeLocal: string): string | null => {
    if (!datetimeLocal) return null;
    const d = new Date(datetimeLocal);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  // ── ブログ操作 ──
  const createBlog = async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) { showMessage('セッションが切れています。再ログインしてください'); return; }
    if (!newBlogForm.title.trim()) { showMessage('タイトルを入力してください'); return; }
    const publishedAt = toIso(newBlogForm.published_at) ?? (newBlogForm.is_published ? new Date().toISOString() : null);
    setSavingBlog(true);
    try {
      const { data, error } = await supabase.from('salon_blogs').insert({
        salon_slug: selectedSlug,
        slug: `blog-${Date.now()}`,
        title: newBlogForm.title.trim(),
        category: newBlogForm.category || null,
        author_name: newBlogForm.author_name || null,
        excerpt: newBlogForm.excerpt || null,
        body: newBlogForm.body || null,
        featured_image_url: newBlogForm.featured_image_url,
        featured_image_aspect: newBlogForm.featured_image_aspect,
        is_published: newBlogForm.is_published,
        published_at: publishedAt,
        sort_order: newBlogForm.sort_order,
      }).select('id').single();
      if (error) { showMessage(`作成失敗: ${error.message}`); return; }
      showMessage('ブログを作成しました');
      setAddingBlog(false);
      setNewBlogForm({ ...EMPTY_BLOG_FORM });
      await loadBlogs(selectedSlug);
      if (data?.id) {
        const { data: blog } = await supabase.from('salon_blogs').select('*').eq('id', data.id).single();
        if (blog) {
          setEditingBlogId(blog.id);
          setBlogForm({
            title: blog.title,
            category: blog.category ?? '',
            author_name: blog.author_name ?? '',
            excerpt: blog.excerpt ?? '',
            body: blog.body ?? '',
            featured_image_url: blog.featured_image_url,
            featured_image_aspect: blog.featured_image_aspect ?? '4:3',
            is_published: blog.is_published,
            published_at: blog.published_at ? blog.published_at.slice(0, 16) : '',
            sort_order: blog.sort_order,
          });
        }
      }
    } finally { setSavingBlog(false); }
  };

  const saveBlog = async () => {
    if (!supabase || !editingBlogId || !blogForm) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) { showMessage('セッションが切れています。再ログインしてください'); return; }
    setSavingBlog(true);
    try {
      const { error } = await supabase.from('salon_blogs').update({
        title: blogForm.title.trim(),
        category: blogForm.category || null,
        author_name: blogForm.author_name || null,
        excerpt: blogForm.excerpt || null,
        body: blogForm.body || null,
        featured_image_url: blogForm.featured_image_url,
        featured_image_aspect: blogForm.featured_image_aspect,
        is_published: blogForm.is_published,
        published_at: toIso(blogForm.published_at) ?? (blogForm.is_published ? new Date().toISOString() : null),
        sort_order: blogForm.sort_order,
        updated_at: new Date().toISOString(),
      }).eq('id', editingBlogId);
      if (error) { showMessage(`保存失敗: ${error.message}`); return; }
      showMessage('保存しました');
      await loadBlogs(selectedSlug);
    } finally { setSavingBlog(false); }
  };

  const toggleBlogPublished = async (blog: Blog) => {
    if (!supabase) return;
    const nextPublished = !blog.is_published;
    const now = new Date().toISOString();
    const { error } = await supabase.from('salon_blogs').update({
      is_published: nextPublished,
      published_at: nextPublished && !blog.published_at ? now : blog.published_at,
      updated_at: now,
    }).eq('id', blog.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    await loadBlogs(selectedSlug);
    if (editingBlogId === blog.id && blogForm) {
      setBlogForm(prev => prev ? { ...prev, is_published: nextPublished } : prev);
    }
  };

  const uploadBlogFeaturedImage = async (file: File) => {
    if (!supabase) return;
    setUploadingBlogImage(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `salons/${selectedSlug}/blog/featured/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) { showMessage(`アップロード失敗: ${upErr.message}`); return; }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = urlData.publicUrl;
      if (editingBlogId && blogForm) {
        setBlogForm(prev => prev ? { ...prev, featured_image_url: url } : prev);
      } else {
        setNewBlogForm(prev => ({ ...prev, featured_image_url: url }));
      }
    } finally {
      setUploadingBlogImage(false);
      if (blogImageRef.current) blogImageRef.current.value = '';
    }
  };

  const uploadBlogMedia = async (file: File) => {
    if (!supabase || !editingBlogId) return;
    setUploadingBlogMedia(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `salons/${selectedSlug}/blog/${editingBlogId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) { showMessage(`アップロード失敗: ${upErr.message}`); return; }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: dbErr } = await supabase.from('salon_blog_media').insert({
        blog_id: editingBlogId,
        media_url: urlData.publicUrl,
        sort_order: blogMedia.length,
      });
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }
      showMessage('画像を追加しました');
      await loadBlogMedia(editingBlogId);
    } finally {
      setUploadingBlogMedia(false);
      if (blogMediaFileRef.current) blogMediaFileRef.current.value = '';
    }
  };

  const toggleBlogMediaActive = async (mediaId: string, current: boolean) => {
    if (!supabase || !editingBlogId) return;
    await supabase.from('salon_blog_media').update({ is_active: !current }).eq('id', mediaId);
    await loadBlogMedia(editingBlogId);
  };

  const saveBlogMediaMeta = async (mediaId: string) => {
    if (!supabase || !editingBlogId) return;
    const { error } = await supabase.from('salon_blog_media').update({
      title: blogMediaMeta.title || null,
      description: blogMediaMeta.description || null,
      alt: blogMediaMeta.alt || null,
      sort_order: blogMediaMeta.sort_order,
      media_aspect: blogMediaMeta.media_aspect,
    }).eq('id', mediaId);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    setEditingBlogMediaId(null);
    await loadBlogMedia(editingBlogId);
  };

  if (!isConfigured) {
    return <div className="text-xs text-stone-400 tracking-wider">Supabase が設定されていません</div>;
  }

  return (
    <div className="max-w-3xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-1">Blog</p>
        <h1 className="text-xl font-light tracking-wider text-stone-800">ブログ管理</h1>
        <p className="text-xs text-stone-400 mt-0.5">店舗ごとのブログ記事を管理します</p>
      </div>

      {/* メッセージ */}
      {message && (
        <div className="mb-4 text-xs text-stone-600 border border-stone-200 px-4 py-2 bg-stone-50">
          {message}
        </div>
      )}

      {/* hidden inputs */}
      <input
        ref={blogImageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const file = e.target.files?.[0]; if (file) uploadBlogFeaturedImage(file); }}
      />
      <input
        ref={blogMediaFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const file = e.target.files?.[0]; if (file) uploadBlogMedia(file); }}
      />

      {/* 店舗セレクタ */}
      <div className="flex gap-1 mb-6">
        {SALON_SLUGS.map(slug => (
          <button
            key={slug}
            type="button"
            onClick={() => setSelectedSlug(slug)}
            className={`text-xs tracking-wider px-4 py-1.5 border transition-colors ${
              selectedSlug === slug
                ? 'border-stone-800 bg-stone-800 text-white'
                : 'border-stone-300 text-stone-500 hover:border-stone-500'
            }`}
          >
            {SALON_LABELS[slug]}
          </button>
        ))}
      </div>

      {/* ブログ一覧 */}
      {loadingBlogs ? (
        <p className="text-xs text-stone-400 tracking-wider">読み込み中...</p>
      ) : (
        <div className="space-y-2 mb-4">
          {salonBlogs.length === 0 && (
            <p className="text-xs text-stone-400">記事がありません</p>
          )}
          {salonBlogs.map(blog => (
            <div key={blog.id} className="border border-stone-200">
              {/* 記事ヘッダー行 */}
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 border ${
                    blog.is_published
                      ? 'border-emerald-400 text-emerald-600'
                      : 'border-stone-300 text-stone-400'
                  }`}>
                    {blog.is_published ? '公開' : '非公開'}
                  </span>
                  <span className="text-xs text-stone-700 truncate">{blog.title}</span>
                  {blog.category && (
                    <span className="shrink-0 text-[10px] text-stone-400">[{blog.category}]</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleBlogPublished(blog)}
                    className="text-[10px] tracking-wider text-stone-500 border border-stone-300 px-2 py-1 hover:border-stone-500 transition-colors"
                  >
                    {blog.is_published ? '非公開に' : '公開に'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingBlogId === blog.id) {
                        setEditingBlogId(null);
                        setBlogForm(null);
                      } else {
                        setEditingBlogId(blog.id);
                        setBlogForm({
                          title: blog.title,
                          category: blog.category ?? '',
                          author_name: blog.author_name ?? '',
                          excerpt: blog.excerpt ?? '',
                          body: blog.body ?? '',
                          featured_image_url: blog.featured_image_url,
                          featured_image_aspect: blog.featured_image_aspect ?? '4:3',
                          is_published: blog.is_published,
                          published_at: blog.published_at ? blog.published_at.slice(0, 16) : '',
                          sort_order: blog.sort_order,
                        });
                      }
                    }}
                    className="text-[10px] tracking-wider text-stone-500 border border-stone-300 px-2 py-1 hover:border-stone-500 transition-colors"
                  >
                    {editingBlogId === blog.id ? '閉じる' : '編集'}
                  </button>
                </div>
              </div>

              {/* 編集フォーム */}
              {editingBlogId === blog.id && blogForm && (
                <div className="border-t border-stone-100 px-4 py-4 space-y-3">
                  {/* タイトル */}
                  <div>
                    <label className="block text-[10px] tracking-wider text-stone-500 mb-1">タイトル *</label>
                    <input
                      type="text"
                      value={blogForm.title}
                      onChange={e => setBlogForm(prev => prev ? { ...prev, title: e.target.value } : prev)}
                      className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  {/* カテゴリ / 著者 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] tracking-wider text-stone-500 mb-1">カテゴリ</label>
                      <input
                        type="text"
                        value={blogForm.category}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, category: e.target.value } : prev)}
                        className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-wider text-stone-500 mb-1">著者名</label>
                      <input
                        type="text"
                        value={blogForm.author_name}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, author_name: e.target.value } : prev)}
                        className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>
                  {/* 概要 */}
                  <div>
                    <label className="block text-[10px] tracking-wider text-stone-500 mb-1">概要（excerpt）</label>
                    <textarea
                      rows={2}
                      value={blogForm.excerpt}
                      onChange={e => setBlogForm(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
                      className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400 resize-none"
                    />
                  </div>
                  {/* 本文 */}
                  <div>
                    <label className="block text-[10px] tracking-wider text-stone-500 mb-1">本文</label>
                    <textarea
                      rows={10}
                      value={blogForm.body}
                      onChange={e => setBlogForm(prev => prev ? { ...prev, body: e.target.value } : prev)}
                      className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400 resize-y"
                    />
                  </div>
                  {/* アイキャッチ */}
                  <div>
                    <label className="block text-[10px] tracking-wider text-stone-500 mb-1">アイキャッチ画像</label>
                    {blogForm.featured_image_url && (
                      <div className="mb-2 flex items-start gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={blogForm.featured_image_url} alt="アイキャッチ" className="h-20 w-auto object-cover border border-stone-200" />
                        <button
                          type="button"
                          onClick={() => setBlogForm(prev => prev ? { ...prev, featured_image_url: null } : prev)}
                          className="text-[10px] text-stone-400 hover:text-stone-600"
                        >アイキャッチを外す</button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => blogImageRef.current?.click()}
                        disabled={uploadingBlogImage}
                        className="text-[10px] tracking-wider text-stone-500 border border-stone-300 px-3 py-1 hover:border-stone-500 transition-colors disabled:opacity-40"
                      >
                        {uploadingBlogImage ? 'アップロード中...' : '画像を選択'}
                      </button>
                      <div>
                        <select
                          value={blogForm.featured_image_aspect}
                          onChange={e => setBlogForm(prev => prev ? { ...prev, featured_image_aspect: e.target.value } : prev)}
                          className="text-xs border border-stone-200 px-2 py-1.5 focus:outline-none focus:border-stone-400"
                        >
                          {BLOG_ASPECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <span className="text-[9px] text-stone-400 ml-1">表示比率</span>
                      </div>
                    </div>
                  </div>
                  {/* 公開設定 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] tracking-wider text-stone-500 mb-1">公開状態</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blogForm.is_published}
                          onChange={e => setBlogForm(prev => prev ? { ...prev, is_published: e.target.checked } : prev)}
                        />
                        <span className="text-xs text-stone-600">公開する</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-wider text-stone-500 mb-1">並び順</label>
                      <input
                        type="number"
                        value={blogForm.sort_order}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, sort_order: Number(e.target.value) } : prev)}
                        className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>
                  {/* 投稿日時 */}
                  <div>
                    <label className="block text-[10px] tracking-wider text-stone-500 mb-1">投稿日時（空欄の場合、公開時に自動セット）</label>
                    <input
                      type="datetime-local"
                      value={blogForm.published_at}
                      onChange={e => setBlogForm(prev => prev ? { ...prev, published_at: e.target.value } : prev)}
                      className="text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  {/* 保存ボタン */}
                  <button
                    type="button"
                    onClick={saveBlog}
                    disabled={savingBlog}
                    className="text-xs tracking-wider text-white bg-stone-800 px-6 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    {savingBlog ? '保存中...' : '保存'}
                  </button>

                  {/* 追加メディア */}
                  <div className="border-t border-stone-100 pt-4 mt-4">
                    <p className="text-[10px] tracking-[0.3em] text-stone-500 uppercase mb-3">追加メディア</p>
                    {loadingBlogMedia ? (
                      <p className="text-[10px] text-stone-400">読み込み中...</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {blogMedia.map(m => (
                          <div key={m.id} className="border border-stone-100 p-2">
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.media_url} alt={m.alt ?? ''} className="h-12 w-auto object-cover border border-stone-200 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-stone-500 truncate">{m.title || '(タイトルなし)'}</p>
                                <p className="text-[10px] text-stone-400">比率: {m.media_aspect} / {m.is_active ? '表示' : '非表示'}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleBlogMediaActive(m.id, m.is_active)}
                                  className="text-[10px] border border-stone-200 px-2 py-0.5 hover:border-stone-400 transition-colors"
                                >{m.is_active ? '非表示' : '表示'}</button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBlogMediaId(editingBlogMediaId === m.id ? null : m.id);
                                    if (editingBlogMediaId !== m.id) {
                                      setBlogMediaMeta({ title: m.title ?? '', description: m.description ?? '', alt: m.alt ?? '', sort_order: m.sort_order, media_aspect: m.media_aspect ?? '4:3' });
                                    }
                                  }}
                                  className="text-[10px] border border-stone-200 px-2 py-0.5 hover:border-stone-400 transition-colors"
                                >編集</button>
                              </div>
                            </div>
                            {editingBlogMediaId === m.id && (
                              <div className="mt-2 space-y-2 pt-2 border-t border-stone-100">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">タイトル</label>
                                    <input type="text" value={blogMediaMeta.title} onChange={e => setBlogMediaMeta(p => ({ ...p, title: e.target.value }))} className="w-full text-[10px] border border-stone-200 px-2 py-1 focus:outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">ALT</label>
                                    <input type="text" value={blogMediaMeta.alt} onChange={e => setBlogMediaMeta(p => ({ ...p, alt: e.target.value }))} className="w-full text-[10px] border border-stone-200 px-2 py-1 focus:outline-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-stone-400 mb-0.5">説明</label>
                                  <input type="text" value={blogMediaMeta.description} onChange={e => setBlogMediaMeta(p => ({ ...p, description: e.target.value }))} className="w-full text-[10px] border border-stone-200 px-2 py-1 focus:outline-none" />
                                </div>
                                <div className="flex gap-4 items-end">
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">並び順</label>
                                    <input type="number" value={blogMediaMeta.sort_order} onChange={e => setBlogMediaMeta(p => ({ ...p, sort_order: Number(e.target.value) }))} className="w-20 text-[10px] border border-stone-200 px-2 py-1 focus:outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">表示比率</label>
                                    <select value={blogMediaMeta.media_aspect} onChange={e => setBlogMediaMeta(p => ({ ...p, media_aspect: e.target.value }))} className="text-[10px] border border-stone-200 px-1 py-1 focus:outline-none">
                                      {BLOG_ASPECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <button type="button" onClick={() => saveBlogMediaMeta(m.id)} className="text-[10px] border border-stone-700 text-stone-700 px-3 py-1 hover:bg-stone-700 hover:text-white transition-colors">保存</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => blogMediaFileRef.current?.click()}
                      disabled={uploadingBlogMedia}
                      className="text-[10px] tracking-wider text-stone-500 border border-stone-300 px-3 py-1 hover:border-stone-500 transition-colors disabled:opacity-40"
                    >
                      {uploadingBlogMedia ? 'アップロード中...' : '+ 画像を追加'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 新規ブログ追加フォーム */}
      {addingBlog ? (
        <div className="border border-stone-200 p-4 space-y-3">
          <p className="text-xs tracking-wider text-stone-600 font-medium">新規ブログ記事</p>
          <div>
            <label className="block text-[10px] tracking-wider text-stone-500 mb-1">タイトル *</label>
            <input
              type="text"
              value={newBlogForm.title}
              onChange={e => setNewBlogForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
              placeholder="記事タイトル"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-wider text-stone-500 mb-1">カテゴリ</label>
              <input
                type="text"
                value={newBlogForm.category}
                onChange={e => setNewBlogForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider text-stone-500 mb-1">著者名</label>
              <input
                type="text"
                value={newBlogForm.author_name}
                onChange={e => setNewBlogForm(prev => ({ ...prev, author_name: e.target.value }))}
                className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-wider text-stone-500 mb-1">概要</label>
            <textarea
              rows={2}
              value={newBlogForm.excerpt}
              onChange={e => setNewBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
              className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-wider text-stone-500 mb-1">本文</label>
            <textarea
              rows={8}
              value={newBlogForm.body}
              onChange={e => setNewBlogForm(prev => ({ ...prev, body: e.target.value }))}
              className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400 resize-y"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-wider text-stone-500 mb-1">アイキャッチ画像</label>
            {newBlogForm.featured_image_url && (
              <div className="mb-2 flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newBlogForm.featured_image_url} alt="アイキャッチ" className="h-20 w-auto object-cover border border-stone-200" />
                <button type="button" onClick={() => setNewBlogForm(prev => ({ ...prev, featured_image_url: null }))} className="text-[10px] text-stone-400 hover:text-stone-600">アイキャッチを外す</button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => blogImageRef.current?.click()}
                disabled={uploadingBlogImage}
                className="text-[10px] tracking-wider text-stone-500 border border-stone-300 px-3 py-1 hover:border-stone-500 transition-colors disabled:opacity-40"
              >
                {uploadingBlogImage ? 'アップロード中...' : '画像を選択'}
              </button>
              <div>
                <select
                  value={newBlogForm.featured_image_aspect}
                  onChange={e => setNewBlogForm(prev => ({ ...prev, featured_image_aspect: e.target.value }))}
                  className="text-xs border border-stone-200 px-2 py-1.5 focus:outline-none focus:border-stone-400"
                >
                  {BLOG_ASPECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <span className="text-[9px] text-stone-400 ml-1">表示比率</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={newBlogForm.is_published}
                  onChange={e => setNewBlogForm(prev => ({ ...prev, is_published: e.target.checked }))}
                />
                <span className="text-xs text-stone-600">公開する</span>
              </label>
            </div>
            <div>
              <label className="block text-[10px] tracking-wider text-stone-500 mb-1">並び順</label>
              <input
                type="number"
                value={newBlogForm.sort_order}
                onChange={e => setNewBlogForm(prev => ({ ...prev, sort_order: Number(e.target.value) }))}
                className="w-full text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-wider text-stone-500 mb-1">投稿日時（空欄の場合、公開時に自動セット）</label>
            <input
              type="datetime-local"
              value={newBlogForm.published_at}
              onChange={e => setNewBlogForm(prev => ({ ...prev, published_at: e.target.value }))}
              className="text-xs border border-stone-200 px-3 py-2 focus:outline-none focus:border-stone-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createBlog}
              disabled={savingBlog}
              className="text-xs tracking-wider text-white bg-stone-800 px-6 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40"
            >
              {savingBlog ? '作成中...' : '作成'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingBlog(false); setNewBlogForm({ ...EMPTY_BLOG_FORM }); }}
              className="text-xs tracking-wider text-stone-500 border border-stone-300 px-4 py-2 hover:border-stone-500 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingBlog(true)}
          className="text-xs tracking-wider text-stone-600 border border-stone-300 px-4 py-1.5 hover:border-stone-500 transition-colors"
        >
          + 新規ブログ記事を追加
        </button>
      )}
    </div>
  );
}
