import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { Footer } from '@/components/Footer';
import { AppHeader } from '@/components/layout/AppHeader';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  addPredictionActual,
  deletePredictionActual,
  deletePredictionRun,
  listPredictionActuals,
  listPredictionRuns,
  runsToLedger,
  type PredictionActualRow,
  type PredictionRunRow,
} from '@/services/predictionLedger';
import { scoreLedger } from '@/utils/ledgerScoring';
import {
  ALL_FATE_DIMENSIONS,
  FATE_DIMENSION_LABELS_BI,
  type FateDimension,
} from '@/types/prediction';

const POLARITY_OPTIONS: { value: -1 | 0 | 1; label: string }[] = [
  { value: 1, label: '吉（正向）' },
  { value: 0, label: '平（中性）' },
  { value: -1, label: '凶（负向）' },
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'complete'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : status === 'partial'
        ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
        : 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{status}</Badge>;
}

function ActualForm({ runId, onAdded }: { runId: string; onAdded: () => void }) {
  const { toast } = useToast();
  const [eventDate, setEventDate] = useState('');
  const [domain, setDomain] = useState<FateDimension>('life');
  const [magnitude, setMagnitude] = useState(5);
  const [polarity, setPolarity] = useState<-1 | 0 | 1>(1);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!eventDate) {
      toast({ title: '请选择事件日期', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const res = await addPredictionActual({ runId, eventDate, domain, magnitude, polarity, note: note || undefined });
    setSaving(false);
    if (res.ok) {
      setNote('');
      onAdded();
      toast({ title: '真实事件已记录' });
    } else {
      toast({ title: '记录失败', description: res.error, variant: 'destructive' });
    }
  };

  return (
    <div className="mt-3 p-3 rounded-lg border border-border/40 bg-card/40 space-y-2">
      <p className="text-xs text-muted-foreground">回填真实事件（用于校验引擎命中率）</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-8 text-xs" />
        <select
          value={domain}
          onChange={e => setDomain(e.target.value as FateDimension)}
          className="h-8 text-xs rounded-md border border-border/40 bg-background px-2"
        >
          {ALL_FATE_DIMENSIONS.map(d => (
            <option key={d} value={d}>{FATE_DIMENSION_LABELS_BI[d].zh}</option>
          ))}
        </select>
        <select
          value={polarity}
          onChange={e => setPolarity(Number(e.target.value) as -1 | 0 | 1)}
          className="h-8 text-xs rounded-md border border-border/40 bg-background px-2"
        >
          {POLARITY_OPTIONS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={magnitude}
          onChange={e => setMagnitude(Number(e.target.value))}
          className="h-8 text-xs rounded-md border border-border/40 bg-background px-2"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>强度 {m}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="备注（可选）"
          className="h-8 text-xs flex-1"
        />
        <Button size="sm" className="h-8" onClick={submit} disabled={saving}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          记录
        </Button>
      </div>
    </div>
  );
}

function RunCard({
  run,
  actuals,
  onChanged,
}: {
  run: PredictionRunRow;
  actuals: PredictionActualRow[];
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const date = run.generatedAt ? new Date(run.generatedAt).toLocaleString('zh-CN') : '';

  const removeRun = async () => {
    if (await deletePredictionRun(run.id)) {
      onChanged();
      toast({ title: '预测记录已删除' });
    }
  };

  const removeActual = async (id: string) => {
    if (await deletePredictionActual(id)) onChanged();
  };

  return (
    <HolographicPanel variant="ritual" innerPadding="md">
      <div className="flex items-center justify-between gap-2">
        <button className="flex-1 text-left" onClick={() => setOpen(o => !o)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-serif text-primary">{date}</span>
            <Badge variant="outline" className="text-[10px]">{run.queryType}</Badge>
            <Badge variant="outline" className="text-[10px]">
              综合置信度 {(run.finalConfidence * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline" className="text-[10px]">{run.engineRecords.length} 引擎</Badge>
            <Badge variant="outline" className="text-[10px]">{actuals.length} 条回填</Badge>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/60 font-mono">{run.predictionId} · {run.algorithmVersion}</p>
        </button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={removeRun} aria-label="删除">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(o => !o)} aria-label="展开">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground/70 border-b border-border/30">
                  <th className="text-left py-1 pr-2 font-normal">引擎</th>
                  <th className="text-left py-1 pr-2 font-normal">状态</th>
                  <th className="text-left py-1 pr-2 font-normal">来源等级</th>
                  <th className="text-right py-1 pr-2 font-normal">置信度（封顶）</th>
                  <th className="text-right py-1 font-normal">警告</th>
                </tr>
              </thead>
              <tbody>
                {run.engineRecords.map(rec => (
                  <tr key={rec.engineName} className="border-b border-border/15">
                    <td className="py-1 pr-2">{rec.engineNameCN}</td>
                    <td className="py-1 pr-2"><StatusBadge status={rec.implementationStatus} /></td>
                    <td className="py-1 pr-2">{rec.sourceGrade}</td>
                    <td className="py-1 pr-2 text-right font-mono">{(rec.cappedConfidence * 100).toFixed(0)}%</td>
                    <td className="py-1 text-right font-mono">{rec.warnings.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {actuals.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">已回填的真实事件</p>
              {actuals.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs bg-card/40 border border-border/30 rounded px-2 py-1">
                  <span>
                    {a.eventDate} · {FATE_DIMENSION_LABELS_BI[a.domain]?.zh ?? a.domain} ·{' '}
                    {a.polarity > 0 ? '吉' : a.polarity < 0 ? '凶' : '平'} · 强度{a.magnitude}
                    {a.note ? ` · ${a.note}` : ''}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeActual(a.id)} aria-label="删除事件">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <ActualForm runId={run.id} onAdded={onChanged} />
        </div>
      )}
    </HolographicPanel>
  );
}

const PredictionHistory = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [runs, setRuns] = useState<PredictionRunRow[]>([]);
  const [actuals, setActuals] = useState<PredictionActualRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [r, a] = await Promise.all([listPredictionRuns(), listPredictionActuals()]);
    setRuns(r);
    setActuals(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) void reload();
    else if (!isLoading) setLoading(false);
  }, [isAuthenticated, isLoading, reload]);

  const scores = useMemo(
    () => scoreLedger(runsToLedger(runs), actuals),
    [runs, actuals],
  );
  const scoredEngines = scores.filter(s => s.claims > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
      <SEO
        title="Prediction Ledger — H-Pulse"
        description="Browse your archived H-Pulse cultural-rule reports, input calibrations and engine-audit runs in one private ledger."
        path="/prediction-history"
      />
      <AppHeader variant="subpage" />

      <main className="flex-1 py-8">
        <div className="container max-w-4xl mx-auto px-4 space-y-4">
          <div className="text-center">
            <Archive className="w-8 h-8 mx-auto text-primary/70 mb-2" />
            <h2 className="text-xl font-serif text-gradient-gold tracking-[0.18em]">预测验证账本</h2>
            <p className="mt-1 text-xs text-muted-foreground/70">
              每次预测自动归档；回填真实事件后按引擎统计校准命中率
            </p>
          </div>

          {!isAuthenticated && !isLoading && (
            <HolographicPanel variant="ritual" innerPadding="lg" className="text-center">
              <p className="text-sm text-muted-foreground">登录后即可查看你的预测档案。</p>
              <div className="mt-4">
                <Button asChild variant="outline" className="border-primary/30 hover:border-primary/60">
                  <Link to="/">返回控制台登录</Link>
                </Button>
              </div>
            </HolographicPanel>
          )}

          {isAuthenticated && scoredEngines.length > 0 && (
            <HolographicPanel variant="ritual" innerPadding="md">
              <h3 className="text-sm font-serif text-primary mb-2">引擎校准统计（基于真实事件回填）</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground/70 border-b border-border/30">
                      <th className="text-left py-1 pr-2 font-normal">引擎</th>
                      <th className="text-right py-1 pr-2 font-normal">判断数</th>
                      <th className="text-right py-1 pr-2 font-normal">命中数</th>
                      <th className="text-right py-1 pr-2 font-normal">命中率</th>
                      <th className="text-right py-1 pr-2 font-normal">平均置信度</th>
                      <th className="text-right py-1 font-normal">校准偏差</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoredEngines.map(s => (
                      <tr key={s.engineName} className="border-b border-border/15">
                        <td className="py-1 pr-2">{s.engineNameCN}</td>
                        <td className="py-1 pr-2 text-right font-mono">{s.claims}</td>
                        <td className="py-1 pr-2 text-right font-mono">{s.hits}</td>
                        <td className="py-1 pr-2 text-right font-mono">{(s.hitRate * 100).toFixed(0)}%</td>
                        <td className="py-1 pr-2 text-right font-mono">{(s.avgCappedConfidence * 100).toFixed(0)}%</td>
                        <td className="py-1 text-right font-mono">{(s.calibrationGap * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HolographicPanel>
          )}

          {isAuthenticated && (
            loading ? (
              <p className="text-center text-sm text-muted-foreground py-8">加载中…</p>
            ) : runs.length === 0 ? (
              <HolographicPanel variant="ritual" innerPadding="lg" className="text-center">
                <p className="text-sm text-muted-foreground">
                  暂无归档预测。在控制台完成一次预测后会自动记录到此账本。
                </p>
              </HolographicPanel>
            ) : (
              runs.map(run => (
                <RunCard
                  key={run.id}
                  run={run}
                  actuals={actuals.filter(a => a.runId === run.id)}
                  onChanged={reload}
                />
              ))
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PredictionHistory;
