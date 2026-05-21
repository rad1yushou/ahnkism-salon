'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// ============================================================
// メディア定数
// ============================================================
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

// ============================================================
// 共通コンポーネント
// ============================================================
const inputBase =
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
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={inputBase + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className={inputBase}
        />
      )}
    </div>
  );
}

// ============================================================
// 採用本文セクション（recruit_sections）
// ============================================================
type RecruitSection = {
  id: string;
  section_key: string;
  title: string;
  body: string;
  items: string[];
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

type SectionForm = {
  section_key: string;
  title: string;
  body: string;
  items: string[];
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_SECTION_FORM: SectionForm = {
  section_key: '',
  title: '',
  body: '',
  items: [],
  media_url: null,
  media_type: null,
  sort_order: 0,
  is_active: true,
};

function toSectionForm(s: RecruitSection): SectionForm {
  return {
    section_key: s.section_key,
    title: s.title,
    body: s.body,
    items: s.items,
    media_url: s.media_url,
    media_type: s.media_type,
    sort_order: s.sort_order,
    is_active: s.is_active,
  };
}

function ItemsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const add = () => onChange([...items, '']);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, val: string) =>
    onChange(items.map((v, idx) => (idx === i ? val : v)));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">
        箇条書きリスト
      </label>
      <div className="space-y-2 mb-2">
        {items.length === 0 && (
          <p className="text-[10px] text-stone-400">
            項目がありません。「+ 項目を追加」で追加してください。
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder="例: 完全週休2日制"
              className="flex-1 border border-stone-300 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
            />
            <button
              type="button"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              className="shrink-0 text-[10px] px-2 py-1.5 border border-stone-300 text-stone-500 hover:bg-stone-50 rounded transition-colors disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveDown(i)}
              disabled={i === items.length - 1}
              className="shrink-0 text-[10px] px-2 py-1.5 border border-stone-300 text-stone-500 hover:bg-stone-50 rounded transition-colors disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 text-[10px] px-2 py-1.5 border border-red-300 text-red-400 hover:bg-red-50 rounded transition-colors"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-[10px] px-3 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors"
      >
        + 項目を追加
      </button>
    </div>
  );
}

type SectionFormOnChange = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => void;

function SectionFormFields({
  f,
  onChange,
  idSuffix,
}: {
  f: SectionForm;
  onChange: SectionFormOnChange;
  idSuffix: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">セクション内容</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="タイトル"
              value={f.title}
              onChange={(v) => onChange('title', v)}
              placeholder="AHNKISMで働く魅力"
              required
            />
            <Field
              label="識別キー (section_key)"
              value={f.section_key}
              onChange={(v) => onChange('section_key', v)}
              placeholder="benefits"
              required
            />
          </div>
          <Field
            label="本文"
            value={f.body}
            onChange={(v) => onChange('body', v)}
            placeholder="セクションの説明文を入力"
            rows={3}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">箇条書き</p>
        <ItemsEditor
          items={f.items}
          onChange={(items) => onChange('items', items)}
        />
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
              id={`sec_is_active_${idSuffix}`}
              type="checkbox"
              checked={f.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
              className="rounded border-stone-300"
            />
            <label htmlFor={`sec_is_active_${idSuffix}`} className="text-xs text-stone-600">
              公開する（チェックを外すと非表示）
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 募集職種（recruit_jobs）
// ============================================================
type Requirement = { label: string; value: string };

type Job = {
  id: string;
  slug: string;
  title: string;
  role_label: string;
  description: string;
  requirements: Requirement[];
  sort_order: number;
  is_active: boolean;
};

type JobForm = {
  slug: string;
  title: string;
  role_label: string;
  description: string;
  requirements: Requirement[];
  sort_order: number;
  is_active: boolean;
};

const EMPTY_JOB_FORM: JobForm = {
  slug: '',
  title: '',
  role_label: '',
  description: '',
  requirements: [],
  sort_order: 0,
  is_active: true,
};

function toJobForm(j: Job): JobForm {
  return {
    slug: j.slug,
    title: j.title,
    role_label: j.role_label,
    description: j.description,
    requirements: j.requirements,
    sort_order: j.sort_order,
    is_active: j.is_active,
  };
}

function RequirementsEditor({
  requirements,
  onChange,
}: {
  requirements: Requirement[];
  onChange: (reqs: Requirement[]) => void;
}) {
  const add = () => onChange([...requirements, { label: '', value: '' }]);
  const remove = (i: number) => onChange(requirements.filter((_, idx) => idx !== i));
  const update = (i: number, key: 'label' | 'value', val: string) =>
    onChange(requirements.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  return (
    <div>
      <label className="block text-[10px] tracking-widest text-stone-500 mb-2">募集要項</label>
      <div className="space-y-2 mb-2">
        {requirements.length === 0 && (
          <p className="text-[10px] text-stone-400">
            項目がありません。「+ 項目を追加」で追加してください。
          </p>
        )}
        {requirements.map((req, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              value={req.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="項目名（例: 給与）"
              className="w-28 border border-stone-300 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white shrink-0"
            />
            <input
              value={req.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="内容（例: 月給25万円〜）"
              className="flex-1 border border-stone-300 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 text-[10px] px-2 py-1.5 border border-red-300 text-red-400 hover:bg-red-50 rounded transition-colors"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-[10px] px-3 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors"
      >
        + 項目を追加
      </button>
    </div>
  );
}

type JobFormOnChange = <K extends keyof JobForm>(key: K, value: JobForm[K]) => void;

function JobFormFields({ f, onChange, idSuffix }: { f: JobForm; onChange: JobFormOnChange; idSuffix: string }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">職種情報</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="タイトル"
              value={f.title}
              onChange={(v) => onChange('title', v)}
              placeholder="スタイリスト募集"
              required
            />
            <Field
              label="職種ラベル"
              value={f.role_label}
              onChange={(v) => onChange('role_label', v)}
              placeholder="スタイリスト"
            />
          </div>
          <Field
            label="スラッグ（URL用）"
            value={f.slug}
            onChange={(v) => onChange('slug', v)}
            placeholder="stylist"
            required
          />
          <Field
            label="説明文"
            value={f.description}
            onChange={(v) => onChange('description', v)}
            placeholder="職種の説明・アピールポイントを入力"
            rows={3}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">募集要項</p>
        <RequirementsEditor
          requirements={f.requirements}
          onChange={(reqs) => onChange('requirements', reqs)}
        />
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
              id={`job_is_active_${idSuffix}`}
              type="checkbox"
              checked={f.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
              className="rounded border-stone-300"
            />
            <label htmlFor={`job_is_active_${idSuffix}`} className="text-xs text-stone-600">
              掲載する（チェックを外すと非表示）
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// メインページコンポーネント
// ============================================================
export default function AdminRecruitPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [activeTab, setActiveTab] = useState<'sections' | 'jobs' | 'contact'>('sections');
  const [message, setMessage] = useState('');

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // ----------------------------------------------------------
  // 採用本文セクション state
  // ----------------------------------------------------------
  const [sections, setSections] = useState<RecruitSection[]>([]);
  const [loadingSec, setLoadingSec] = useState(true);
  const [savingSec, setSavingSec] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [secForm, setSecForm] = useState<SectionForm | null>(null);
  const [isAddingNewSec, setIsAddingNewSec] = useState(false);
  const [newSecForm, setNewSecForm] = useState<SectionForm>({ ...EMPTY_SECTION_FORM });
  const [savingNewSec, setSavingNewSec] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const loadSections = useCallback(async () => {
    if (!supabase) { setLoadingSec(false); return; }
    setLoadingSec(true);
    const { data, error } = await supabase
      .from('recruit_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setSections(
        (data ?? []).map((s) => ({
          ...s,
          items: Array.isArray(s.items) ? s.items : [],
          media_url: s.media_url ?? null,
          media_type: s.media_type ?? null,
        }))
      );
    }
    setLoadingSec(false);
  }, [supabase]);

  useEffect(() => { loadSections(); }, [loadSections]);

  const startEditSec = (s: RecruitSection) => {
    setIsAddingNewSec(false);
    setEditingSecId(s.id);
    setSecForm(toSectionForm(s));
  };
  const cancelEditSec = () => { setEditingSecId(null); setSecForm(null); };
  const setSecField = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => {
    setSecForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const validateSection = (f: SectionForm): string | null => {
    if (!f.title.trim()) return 'タイトルは必須です';
    if (!f.section_key.trim()) return '識別キーは必須です';
    if (!/^[a-z0-9_-]+$/.test(f.section_key)) return '識別キーは英小文字・数字・ハイフン・アンダースコアのみ使用できます';
    return null;
  };

  const saveEditSec = async (secId: string) => {
    if (!supabase || !secForm) return;
    const err = validateSection(secForm);
    if (err) { showMessage(err); return; }
    setSavingSec(true);
    const { error } = await supabase
      .from('recruit_sections')
      .update({
        section_key: secForm.section_key,
        title: secForm.title,
        body: secForm.body,
        items: secForm.items,
        sort_order: secForm.sort_order,
        is_active: secForm.is_active,
      })
      .eq('id', secId);
    setSavingSec(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEditSec();
    await loadSections();
  };

  const openAddNewSec = () => {
    cancelEditSec();
    const maxSort = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) + 1 : 1;
    setNewSecForm({ ...EMPTY_SECTION_FORM, sort_order: maxSort });
    setIsAddingNewSec(true);
  };
  const cancelAddNewSec = () => { setIsAddingNewSec(false); setNewSecForm({ ...EMPTY_SECTION_FORM }); };

  const addSection = async () => {
    if (!supabase) return;
    const err = validateSection(newSecForm);
    if (err) { showMessage(err); return; }
    setSavingNewSec(true);
    const { error } = await supabase
      .from('recruit_sections')
      .insert({
        section_key: newSecForm.section_key,
        title: newSecForm.title,
        body: newSecForm.body,
        items: newSecForm.items,
        sort_order: newSecForm.sort_order,
        is_active: newSecForm.is_active,
      });
    setSavingNewSec(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newSecForm.title}」を追加しました`);
    cancelAddNewSec();
    await loadSections();
  };

  const toggleActiveSec = async (s: RecruitSection) => {
    if (!supabase) return;
    await supabase.from('recruit_sections').update({ is_active: !s.is_active }).eq('id', s.id);
    await loadSections();
  };

  const moveSec = async (id: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = sections.findIndex((s) => s.id === id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const a = sections[idx];
    const b = sections[targetIdx];
    await Promise.all([
      supabase.from('recruit_sections').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('recruit_sections').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadSections();
  };

  const deleteSec = async (s: RecruitSection) => {
    if (!supabase) return;
    if (!window.confirm(`「${s.title}」を削除しますか？この操作は取り消せません。`)) return;
    if (s.media_url) {
      const path = extractStoragePath(s.media_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase.from('recruit_sections').delete().eq('id', s.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${s.title}」を削除しました`);
    if (editingSecId === s.id) cancelEditSec();
    await loadSections();
  };

  const uploadMedia = async (file: File, sec: RecruitSection) => {
    if (!supabase) return;
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = MEDIA_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      showMessage('jpg / png / webp / gif / mp4 / mov / webm のみアップロードできます');
      return;
    }
    if (isImage && file.size > IMAGE_MAX_SIZE) { showMessage('画像のサイズは 5MB 以下にしてください'); return; }
    if (isVideo && file.size > MEDIA_MAX_VIDEO_SIZE) { showMessage('動画のサイズは 50MB 以下にしてください'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `recruit-sections/${sec.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadErr) { showMessage(`アップロード失敗: ${uploadErr.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (sec.media_url) {
        const oldPath = extractStoragePath(sec.media_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const { error: dbErr } = await supabase
        .from('recruit_sections')
        .update({ media_url: publicUrl, media_type: mediaType })
        .eq('id', sec.id);
      if (dbErr) { showMessage(`DB保存失敗: ${dbErr.message}`); return; }

      setSecField('media_url', publicUrl);
      setSecField('media_type', mediaType);
      showMessage('メディアをアップロードしました');
      await loadSections();
    } finally {
      setUploading(false);
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const deleteMedia = async (sec: RecruitSection) => {
    if (!supabase) return;
    if (!window.confirm('このメディアを削除しますか？')) return;
    if (sec.media_url) {
      const path = extractStoragePath(sec.media_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase
      .from('recruit_sections')
      .update({ media_url: null, media_type: null })
      .eq('id', sec.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    setSecField('media_url', null);
    setSecField('media_type', null);
    showMessage('メディアを削除しました');
    await loadSections();
  };

  // ----------------------------------------------------------
  // 募集職種 state
  // ----------------------------------------------------------
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [savingJob, setSavingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<JobForm | null>(null);
  const [isAddingNewJob, setIsAddingNewJob] = useState(false);
  const [newJobForm, setNewJobForm] = useState<JobForm>({ ...EMPTY_JOB_FORM });
  const [savingNewJob, setSavingNewJob] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!supabase) { setLoadingJobs(false); return; }
    setLoadingJobs(true);
    const { data, error } = await supabase
      .from('recruit_jobs')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      setJobs(
        (data ?? []).map((j) => ({
          ...j,
          requirements: Array.isArray(j.requirements) ? j.requirements : [],
        }))
      );
    }
    setLoadingJobs(false);
  }, [supabase]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const startEditJob = (j: Job) => {
    setIsAddingNewJob(false);
    setEditingJobId(j.id);
    setJobForm(toJobForm(j));
  };
  const cancelEditJob = () => { setEditingJobId(null); setJobForm(null); };
  const setJobField = <K extends keyof JobForm>(key: K, value: JobForm[K]) => {
    setJobForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const validateJob = (f: JobForm): string | null => {
    if (!f.title.trim()) return 'タイトルは必須です';
    if (!f.slug.trim()) return 'スラッグは必須です';
    if (!/^[a-z0-9-]+$/.test(f.slug)) return 'スラッグは英小文字・数字・ハイフンのみ使用できます';
    return null;
  };

  const saveEditJob = async (jobId: string) => {
    if (!supabase || !jobForm) return;
    const err = validateJob(jobForm);
    if (err) { showMessage(err); return; }
    setSavingJob(true);
    const { error } = await supabase
      .from('recruit_jobs')
      .update({
        slug: jobForm.slug,
        title: jobForm.title,
        role_label: jobForm.role_label,
        description: jobForm.description,
        requirements: jobForm.requirements,
        sort_order: jobForm.sort_order,
        is_active: jobForm.is_active,
      })
      .eq('id', jobId);
    setSavingJob(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('保存しました');
    cancelEditJob();
    await loadJobs();
  };

  const openAddNewJob = () => {
    cancelEditJob();
    const maxSort = jobs.length > 0 ? Math.max(...jobs.map((j) => j.sort_order)) + 1 : 1;
    setNewJobForm({ ...EMPTY_JOB_FORM, sort_order: maxSort });
    setIsAddingNewJob(true);
  };
  const cancelAddNewJob = () => { setIsAddingNewJob(false); setNewJobForm({ ...EMPTY_JOB_FORM }); };

  const addJob = async () => {
    if (!supabase) return;
    const err = validateJob(newJobForm);
    if (err) { showMessage(err); return; }
    setSavingNewJob(true);
    const { error } = await supabase
      .from('recruit_jobs')
      .insert({
        slug: newJobForm.slug,
        title: newJobForm.title,
        role_label: newJobForm.role_label,
        description: newJobForm.description,
        requirements: newJobForm.requirements,
        sort_order: newJobForm.sort_order,
        is_active: newJobForm.is_active,
      });
    setSavingNewJob(false);
    if (error) { showMessage(`追加失敗: ${error.message}`); return; }
    showMessage(`「${newJobForm.title}」を追加しました`);
    cancelAddNewJob();
    await loadJobs();
  };

  const toggleActiveJob = async (j: Job) => {
    if (!supabase) return;
    await supabase.from('recruit_jobs').update({ is_active: !j.is_active }).eq('id', j.id);
    await loadJobs();
  };

  const moveJob = async (id: string, dir: 'up' | 'down') => {
    if (!supabase) return;
    const idx = jobs.findIndex((j) => j.id === id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= jobs.length) return;
    const a = jobs[idx];
    const b = jobs[targetIdx];
    await Promise.all([
      supabase.from('recruit_jobs').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('recruit_jobs').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await loadJobs();
  };

  const deleteJob = async (j: Job) => {
    if (!supabase) return;
    if (!window.confirm(`「${j.title}」を削除しますか？この操作は取り消せません。`)) return;
    const { error } = await supabase.from('recruit_jobs').delete().eq('id', j.id);
    if (error) { showMessage(`削除失敗: ${error.message}`); return; }
    showMessage(`「${j.title}」を削除しました`);
    if (editingJobId === j.id) cancelEditJob();
    await loadJobs();
  };

  // ----------------------------------------------------------
  // 問い合わせ先設定 state
  // ----------------------------------------------------------
  type ContactForm = {
    title: string;
    body: string;
    email: string;
    phone: string;
    line_url: string;
    instagram_url: string;
    button_label: string;
    primary_url: string;
    is_active: boolean;
  };

  const EMPTY_CONTACT_FORM: ContactForm = {
    title: '応募・お問い合わせ',
    body: '',
    email: '',
    phone: '',
    line_url: '',
    instagram_url: '',
    button_label: '応募・お問い合わせはこちら',
    primary_url: '',
    is_active: true,
  };

  const [contactForm, setContactForm] = useState<ContactForm>({ ...EMPTY_CONTACT_FORM });
  const [loadingContact, setLoadingContact] = useState(true);
  const [savingContact, setSavingContact] = useState(false);

  const loadContact = useCallback(async () => {
    if (!supabase) { setLoadingContact(false); return; }
    setLoadingContact(true);
    const { data } = await supabase
      .from('recruit_contact_settings')
      .select('title, body, email, phone, line_url, instagram_url, button_label, primary_url, is_active')
      .eq('setting_key', 'default')
      .maybeSingle();
    if (data) {
      setContactForm({
        title: data.title,
        body: data.body,
        email: data.email,
        phone: data.phone,
        line_url: data.line_url,
        instagram_url: data.instagram_url,
        button_label: data.button_label,
        primary_url: data.primary_url,
        is_active: data.is_active,
      });
    }
    setLoadingContact(false);
  }, [supabase]);

  useEffect(() => { loadContact(); }, [loadContact]);

  const saveContact = async () => {
    if (!supabase) return;
    setSavingContact(true);
    const { error } = await supabase
      .from('recruit_contact_settings')
      .upsert({ setting_key: 'default', ...contactForm }, { onConflict: 'setting_key' });
    setSavingContact(false);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage('問い合わせ先を保存しました');
  };

  // ----------------------------------------------------------
  // レンダー
  // ----------------------------------------------------------
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">採用情報 管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          採用ページの本文セクションと募集職種を管理します。
        </p>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          Supabase の環境変数が設定されていません。
        </div>
      )}

      {message && (
        <div className="bg-stone-800 text-white text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      {/* タブ */}
      <div className="border-b border-stone-200">
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-1 mr-6 text-xs tracking-wider border-b-2 transition-colors ${
            activeTab === 'sections'
              ? 'border-stone-800 text-stone-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          採用本文セクション
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-1 mr-6 text-xs tracking-wider border-b-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-stone-800 text-stone-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          募集職種
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`pb-3 px-1 text-xs tracking-wider border-b-2 transition-colors ${
            activeTab === 'contact'
              ? 'border-stone-800 text-stone-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          問い合わせ先
        </button>
      </div>

      {/* ========== 採用本文セクション タブ ========== */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">
            採用ページ上部に表示するセクションを管理します。各セクションに画像または動画を1つ追加できます。
          </p>

          {/* 新規追加フォーム */}
          {!isAddingNewSec ? (
            <button
              onClick={openAddNewSec}
              disabled={!isConfigured}
              className="px-4 py-2 rounded border border-stone-400 text-stone-600 text-xs hover:bg-stone-100 transition-colors disabled:opacity-40"
            >
              + 新規セクションを追加
            </button>
          ) : (
            <section className="bg-white border border-[#C9A96E] rounded-lg">
              <div className="px-5 py-4 border-b border-stone-100">
                <p className="text-sm font-medium text-stone-800">新規セクションを追加</p>
              </div>
              <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                <SectionFormFields
                  f={newSecForm}
                  onChange={(key, value) => setNewSecForm((prev) => ({ ...prev, [key]: value }))}
                  idSuffix="new"
                />
                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                  <button
                    onClick={addSection}
                    disabled={!isConfigured || savingNewSec}
                    className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                  >
                    {savingNewSec ? '追加中...' : '追加する'}
                  </button>
                  <button
                    onClick={cancelAddNewSec}
                    className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 一覧 */}
          {loadingSec ? (
            <p className="text-xs text-stone-400">読み込み中...</p>
          ) : sections.length === 0 ? (
            <p className="text-xs text-stone-400">セクションがありません</p>
          ) : (
            <div className="space-y-4">
              {/* hidden file input（編集中セクション共通） */}
              <input
                ref={mediaFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                className="hidden"
                disabled={!isConfigured || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const sec = sections.find((s) => s.id === editingSecId);
                  if (file && sec) uploadMedia(file, sec);
                }}
              />

              {sections.map((s, si) => (
                <section key={s.id} className="bg-white border border-stone-200 rounded-lg">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                        s.is_active ? 'bg-green-500' : 'bg-stone-400'
                      }`}>
                        {s.is_active ? '公開中' : '非表示'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800 tracking-wide">{s.title}</p>
                        <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                          key: {s.section_key}
                          {`　sort: ${s.sort_order}`}
                          {s.media_type && `　${s.media_type}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveSec(s.id, 'up')}
                        disabled={!isConfigured || si === 0}
                        className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveSec(s.id, 'down')}
                        disabled={!isConfigured || si === sections.length - 1}
                        className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleActiveSec(s)}
                        disabled={!isConfigured}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                          s.is_active
                            ? 'border-green-400 text-green-600 hover:bg-green-50'
                            : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        {s.is_active ? '公開中' : '非表示'}
                      </button>
                      {editingSecId === s.id ? (
                        <button
                          onClick={cancelEditSec}
                          className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                        >
                          閉じる
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditSec(s)}
                          disabled={!isConfigured}
                          className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                        >
                          編集
                        </button>
                      )}
                      <button
                        onClick={() => deleteSec(s)}
                        disabled={!isConfigured}
                        className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {editingSecId === s.id && secForm && (
                    <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                      <SectionFormFields f={secForm} onChange={setSecField} idSuffix={s.id} />

                      {/* 画像 / 動画 */}
                      <div>
                        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">画像 / 動画</p>
                        {secForm.media_url && (
                          <div className="mb-3">
                            <div className="w-full aspect-video bg-stone-100 rounded overflow-hidden relative mb-2">
                              {secForm.media_type === 'video' ? (
                                <video
                                  src={secForm.media_url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <Image
                                  src={secForm.media_url}
                                  alt={secForm.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              )}
                            </div>
                            <button
                              onClick={() => deleteMedia(s)}
                              disabled={!isConfigured || uploading}
                              className="text-[10px] py-1 px-2 border border-red-300 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                            >
                              メディアを削除
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => mediaFileRef.current?.click()}
                          disabled={!isConfigured || uploading}
                          className="text-[10px] py-1 px-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded transition-colors disabled:opacity-40"
                        >
                          {uploading
                            ? 'アップロード中...'
                            : secForm.media_url
                            ? 'メディアを差し替え'
                            : 'メディアをアップロード'}
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1">
                          jpg / png / webp / gif（5MB以下）、mp4 / mov / webm（50MB以下）
                        </p>
                      </div>

                      {/* 保存・キャンセル */}
                      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => saveEditSec(s.id)}
                          disabled={!isConfigured || savingSec}
                          className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                        >
                          {savingSec ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={cancelEditSec}
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
      )}

      {/* ========== 募集職種 タブ ========== */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">
            採用ページ下部に表示する募集職種を管理します。スラッグが URL になります（例: stylist → /recruit/stylist）。
          </p>

          {/* 新規追加フォーム */}
          {!isAddingNewJob ? (
            <button
              onClick={openAddNewJob}
              disabled={!isConfigured}
              className="px-4 py-2 rounded border border-stone-400 text-stone-600 text-xs hover:bg-stone-100 transition-colors disabled:opacity-40"
            >
              + 新規職種を追加
            </button>
          ) : (
            <section className="bg-white border border-[#C9A96E] rounded-lg">
              <div className="px-5 py-4 border-b border-stone-100">
                <p className="text-sm font-medium text-stone-800">新規職種を追加</p>
              </div>
              <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                <JobFormFields
                  f={newJobForm}
                  onChange={(key, value) => setNewJobForm((prev) => ({ ...prev, [key]: value }))}
                  idSuffix="new"
                />
                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                  <button
                    onClick={addJob}
                    disabled={!isConfigured || savingNewJob}
                    className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                  >
                    {savingNewJob ? '追加中...' : '追加する'}
                  </button>
                  <button
                    onClick={cancelAddNewJob}
                    className="px-4 py-1.5 rounded border border-stone-300 text-stone-500 text-xs hover:bg-stone-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 一覧 */}
          {loadingJobs ? (
            <p className="text-xs text-stone-400">読み込み中...</p>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-stone-400">職種がありません</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((j, ji) => (
                <section key={j.id} className="bg-white border border-stone-200 rounded-lg">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white ${
                        j.is_active ? 'bg-green-500' : 'bg-stone-400'
                      }`}>
                        {j.is_active ? '掲載中' : '非掲載'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800 tracking-wide">{j.title}</p>
                        <p className="text-[10px] text-stone-400 tracking-wider mt-0.5">
                          /recruit/{j.slug}
                          {j.role_label && `　${j.role_label}`}
                          {`　sort: ${j.sort_order}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveJob(j.id, 'up')}
                        disabled={!isConfigured || ji === 0}
                        className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveJob(j.id, 'down')}
                        disabled={!isConfigured || ji === jobs.length - 1}
                        className="text-[10px] px-2 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleActiveJob(j)}
                        disabled={!isConfigured}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                          j.is_active
                            ? 'border-green-400 text-green-600 hover:bg-green-50'
                            : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        {j.is_active ? '掲載中' : '非掲載'}
                      </button>
                      {editingJobId === j.id ? (
                        <button
                          onClick={cancelEditJob}
                          className="text-[10px] px-3 py-1 rounded border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                        >
                          閉じる
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditJob(j)}
                          disabled={!isConfigured}
                          className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                        >
                          編集
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(j)}
                        disabled={!isConfigured}
                        className="text-[10px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {editingJobId === j.id && jobForm && (
                    <div className="border-t border-stone-100 px-5 py-5 space-y-5">
                      <JobFormFields f={jobForm} onChange={setJobField} idSuffix={j.id} />
                      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => saveEditJob(j.id)}
                          disabled={!isConfigured || savingJob}
                          className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                        >
                          {savingJob ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={cancelEditJob}
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
      )}

      {/* ========== 問い合わせ先 タブ ========== */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">
            採用職種ページ下部に表示する問い合わせ先を管理します。採用職種すべてで共通です。
          </p>

          {loadingContact ? (
            <p className="text-xs text-stone-400">読み込み中...</p>
          ) : (
            <section className="bg-white border border-stone-200 rounded-lg">
              <div className="px-5 py-5 space-y-5">
                <div>
                  <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">見出し・説明</p>
                  <div className="space-y-3">
                    <Field
                      label="見出し"
                      value={contactForm.title}
                      onChange={(v) => setContactForm((p) => ({ ...p, title: v }))}
                      placeholder="応募・お問い合わせ"
                    />
                    <Field
                      label="説明文（改行反映）"
                      value={contactForm.body}
                      onChange={(v) => setContactForm((p) => ({ ...p, body: v }))}
                      placeholder="サロン見学・面接希望の方は下記よりご連絡ください。"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">連絡先</p>
                  <div className="space-y-3">
                    <Field
                      label="メール"
                      value={contactForm.email}
                      onChange={(v) => setContactForm((p) => ({ ...p, email: v }))}
                      placeholder="info@example.com"
                      type="email"
                    />
                    <Field
                      label="電話番号"
                      value={contactForm.phone}
                      onChange={(v) => setContactForm((p) => ({ ...p, phone: v }))}
                      placeholder="06-0000-0000"
                    />
                    <Field
                      label="LINE URL"
                      value={contactForm.line_url}
                      onChange={(v) => setContactForm((p) => ({ ...p, line_url: v }))}
                      placeholder="https://lin.ee/..."
                    />
                    <Field
                      label="Instagram URL"
                      value={contactForm.instagram_url}
                      onChange={(v) => setContactForm((p) => ({ ...p, instagram_url: v }))}
                      placeholder="https://www.instagram.com/..."
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">ボタン</p>
                  <div className="space-y-3">
                    <Field
                      label="ボタン文言"
                      value={contactForm.button_label}
                      onChange={(v) => setContactForm((p) => ({ ...p, button_label: v }))}
                      placeholder="応募・お問い合わせはこちら"
                    />
                    <Field
                      label="優先リンク URL（空の場合はメールの mailto を使用）"
                      value={contactForm.primary_url}
                      onChange={(v) => setContactForm((p) => ({ ...p, primary_url: v }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">表示設定</p>
                  <div className="flex items-center gap-2">
                    <input
                      id="contact_is_active"
                      type="checkbox"
                      checked={contactForm.is_active}
                      onChange={(e) => setContactForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="rounded border-stone-300"
                    />
                    <label htmlFor="contact_is_active" className="text-xs text-stone-600">
                      公開する（チェックを外すと非表示・SITE.email にフォールバック）
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <button
                    onClick={saveContact}
                    disabled={!isConfigured || savingContact}
                    className="px-4 py-1.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:opacity-40"
                  >
                    {savingContact ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
