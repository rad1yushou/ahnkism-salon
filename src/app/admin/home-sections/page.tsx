'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type HomeSection = {
  id: string;
  section_key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminHomeSectionsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isConfigured = !!supabase;

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // 各行の sort_order 入力値を id をキーに管理
  const [sortInputs, setSortInputs] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('home_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      showMessage(`取得失敗: ${error.message}`);
    } else {
      const rows = data ?? [];
      setSections(rows);
      // 入力値の初期化
      const inputs: Record<string, number> = {};
      rows.forEach((s) => { inputs[s.id] = s.sort_order; });
      setSortInputs(inputs);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveSortOrder = async (s: HomeSection) => {
    if (!supabase) return;
    const newSort = sortInputs[s.id] ?? s.sort_order;
    setSavingId(s.id);
    const { error } = await supabase
      .from('home_sections')
      .update({ sort_order: newSort })
      .eq('id', s.id);
    setSavingId(null);
    if (error) { showMessage(`保存失敗: ${error.message}`); return; }
    showMessage(`「${s.label}」の表示順を保存しました`);
    await loadData();
  };

  const toggleActive = async (s: HomeSection) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('home_sections')
      .update({ is_active: !s.is_active })
      .eq('id', s.id);
    if (error) { showMessage(`更新失敗: ${error.message}`); return; }
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-medium text-stone-800 tracking-wide">ページ構成管理</h1>
        <p className="text-xs text-stone-500 mt-1">
          トップページの管理対象セクションの表示順・公開設定を変更します。
          Hero・口コミ・採用・予約CTAは固定です。
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

      {/* 固定セクションの説明 */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg px-5 py-4 space-y-2">
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">固定セクション（変更不可）</p>
        <div className="space-y-1.5">
          {['Hero（最上部固定）', '口コミ', '採用情報', '予約 CTA（最下部固定）'].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium text-white bg-stone-300">固定</span>
              <span className="text-xs text-stone-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 管理対象セクション一覧 */}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">管理対象セクション</p>
        {loading ? (
          <p className="text-xs text-stone-400">読み込み中...</p>
        ) : sections.length === 0 ? (
          <p className="text-xs text-stone-400">データがありません</p>
        ) : (
          <div className="space-y-3">
            {sections.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-stone-200 rounded-lg px-5 py-4 flex items-center gap-4"
              >
                {/* 公開バッジ */}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium text-white shrink-0 ${
                  s.is_active ? 'bg-green-500' : 'bg-stone-400'
                }`}>
                  {s.is_active ? '表示中' : '非表示'}
                </span>

                {/* ラベル・key */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{s.label}</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">{s.section_key}</p>
                </div>

                {/* sort_order 入力 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-stone-400 tracking-widest">順</label>
                  <input
                    type="number"
                    value={sortInputs[s.id] ?? s.sort_order}
                    onChange={(e) =>
                      setSortInputs((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                    }
                    className="w-14 border border-stone-300 rounded px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-stone-500 bg-white text-center"
                  />
                </div>

                {/* 保存ボタン */}
                <button
                  onClick={() => saveSortOrder(s)}
                  disabled={!isConfigured || savingId === s.id}
                  className="text-[10px] px-3 py-1 rounded border border-stone-400 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 shrink-0"
                >
                  {savingId === s.id ? '保存中...' : '保存'}
                </button>

                {/* 公開トグル */}
                <button
                  onClick={() => toggleActive(s)}
                  disabled={!isConfigured}
                  className={`text-[10px] px-3 py-1 rounded border transition-colors disabled:opacity-40 shrink-0 ${
                    s.is_active
                      ? 'border-green-400 text-green-600 hover:bg-green-50'
                      : 'border-stone-300 text-stone-400 hover:bg-stone-50'
                  }`}
                >
                  {s.is_active ? '非表示にする' : '表示する'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-stone-400">
        ※ 「順」を変更して「保存」を押すと表示順が変わります。同じ数値のセクションがある場合は登録順で表示されます。
      </p>
    </div>
  );
}
