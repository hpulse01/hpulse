import { AlertTriangle } from 'lucide-react';
interface Props { hasName: boolean; missingFields?: string[] }

export function NumerologyMissingInputPanel({ hasName, missingFields }: Props) {
  if (hasName && (!missingFields || missingFields.length === 0)) return null;
  return (
    <div className="rounded-md border border-amber-400/30 bg-amber-400/[0.04] p-3 text-[11px] text-amber-200/85 space-y-1">
      <div className="flex items-center gap-1.5 text-amber-300/90">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="font-mono uppercase tracking-[0.2em]">缺少输入 · Missing Input</span>
      </div>
      {!hasName && <div>未提供姓名输入，因此姓名类数字 (Destiny / Soul Urge / Personality) 未计算 — name-derived numbers omitted.</div>}
      {missingFields?.map((f, i) => <div key={i}>· {f}</div>)}
    </div>
  );
}
