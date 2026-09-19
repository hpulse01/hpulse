import { AlertTriangle } from 'lucide-react';
interface Props { hasName: boolean; hasHebrew: boolean }
export function KabbalahMissingInputPanel({ hasName, hasHebrew }: Props) {
  if (hasName && hasHebrew) return null;
  return (
    <div className="rounded-md border border-amber-400/30 bg-amber-400/[0.04] p-3 text-[11px] text-amber-200/85 space-y-1">
      <div className="flex items-center gap-1.5 text-amber-300/90">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="font-mono uppercase tracking-[0.2em]">输入降级 · Input Degraded</span>
      </div>
      {!hasName && <div>· 未提供姓名 — name-derived gematria omitted, no fabrication.</div>}
      {hasName && !hasHebrew && <div>· 使用了显式拉丁拼写 — coarse transliteration is shown, and Hebrew final forms are not inferred.</div>}
    </div>
  );
}
