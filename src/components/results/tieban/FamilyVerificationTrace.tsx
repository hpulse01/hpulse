import type { KaoKeWithMatch } from '@/utils/tiebanAlgorithm';

interface Props {
  selectedOption?: KaoKeWithMatch | null;
  expectedFact?: { fatherZodiac?: number; motherZodiac?: number; parentsStatus?: string; siblingsCount?: number } | null;
  calibrationTrace?: string[];
  systemOffset?: number;
  theoreticalBase?: number;
  confirmedClauseId?: number | null;
}

const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/** FamilyVerificationTrace — 六亲校时 trace + how systemOffset was derived. */
export function FamilyVerificationTrace({
  selectedOption, expectedFact, calibrationTrace, systemOffset, theoreticalBase, confirmedClauseId,
}: Props) {
  if (!selectedOption && !expectedFact) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无六亲校时数据 / Six-relations calibration not run.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {expectedFact && (
          <div className="rounded-md border border-primary/15 bg-card/30 p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">用户输入事实 · Expected Fact</div>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[11px] font-sans">
              <Row label="父属相" value={expectedFact.fatherZodiac != null ? ZODIAC[expectedFact.fatherZodiac] : '—'} />
              <Row label="母属相" value={expectedFact.motherZodiac != null ? ZODIAC[expectedFact.motherZodiac] : '—'} />
              <Row label="父母状况" value={expectedFact.parentsStatus ?? '—'} />
              <Row label="兄弟姐妹" value={expectedFact.siblingsCount != null ? `${expectedFact.siblingsCount}` : '—'} />
            </dl>
          </div>
        )}
        {selectedOption && (
          <div className="rounded-md border border-emerald-400/40 bg-emerald-400/[0.05] p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-300">锁定时辰 · Locked</div>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[11px] font-sans">
              <Row label="刻位" value={selectedOption.label} />
              <Row label="时间区间" value={selectedOption.timeRange} />
              <Row label="对应条文" value={`#${selectedOption.clauseNumber}`} />
              <Row label="匹配评分" value={`${selectedOption.matchScore}/100`} />
            </dl>
          </div>
        )}
      </div>

      <div className="rounded-md border border-primary/20 bg-card/40 p-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">systemOffset 推导</div>
        <div className="mt-1 font-mono text-[11px] text-foreground/90 leading-relaxed">
          systemOffset = confirmedClauseId({confirmedClauseId ?? '—'}) − theoreticalBase({theoreticalBase ?? '—'})
          {' = '}
          <span className={(systemOffset ?? 0) === 0 ? 'text-muted-foreground/70' : 'text-primary'}>
            {systemOffset ?? '—'}
          </span>
        </div>
      </div>

      {calibrationTrace && calibrationTrace.length > 0 && (
        <details className="rounded-md border border-primary/15 bg-card/30">
          <summary className="cursor-pointer px-3 py-2 text-xs font-mono text-muted-foreground/85">
            calibrationTrace · {calibrationTrace.length} 步 (点击展开)
          </summary>
          <ol className="border-t border-primary/10 px-4 py-2 space-y-1 text-[11px] font-mono text-muted-foreground/85 max-h-60 overflow-y-auto scrollbar-thin">
            {calibrationTrace.map((s, i) => (
              <li key={i}><span className="text-primary/55">{String(i + 1).padStart(2, '0')}</span> · {s}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground/70 font-mono text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className="text-foreground/90 font-serif tracking-wider">{value}</dd>
    </>
  );
}
