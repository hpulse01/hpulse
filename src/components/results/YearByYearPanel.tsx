/**
 * YearByYearPanel — 逐年详批.
 *
 * For each year inside the finite analysis window, fuses per-year rule data
 * into one explicit, detailed view:
 *  - 铁板神数: 流年条文 (12,000-clause DB), 纳音, 太玄乘数
 *  - 八字: 大运所属, 流年干支/十神/冲合/风险/机会 (core analyzeFlowYear),
 *    可展开的逐月流月明细 (core analyzeFlowMonth)
 *  - 紫微: 流年宫位/主星/四化 (core calculateLiunian)
 *  - 情景融合: 该年规则事件 (强度/类别/向量影响/支持引擎)
 *
 * Years are grouped by 大运 (10-year cycles); clause text is lazily
 * fetched from Supabase per group. All engine computations are
 * deterministic (explicit targetYear, never system clock).
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { calculateBaziChart, analyzeFlowYear, analyzeFlowMonth } from '@/core/bazi';
import type { BaziChart, FlowYearInfo, FlowMonthInfo } from '@/core/bazi';
import { calculateZiweiChart } from '@/core/ziwei';
import type { LiunianStep } from '@/core/ziwei';
import { fetchClausesByNumbers } from '@/services/SupabaseService';
import type {
  FullDestinyReport, TiebanInput, FlowYearClause, DaYunCycle,
} from '@/utils/tiebanAlgorithm';
import type { CollapseResult, CollapsedPathNode } from '@/types/destinyTree';
import type { FateDimension } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronDown, ChevronUp, CalendarDays, Scroll, BookOpen, Atom,
  Sparkles, AlertTriangle, TrendingUp,
} from 'lucide-react';

interface YearDetail {
  age: number;
  year: number;
  tieban: FlowYearClause;
  daYun: DaYunCycle | null;
  baziFlowYear: FlowYearInfo | null;
  ziweiLiunian: LiunianStep | null;
  events: CollapsedPathNode[];
  isTerminalYear: boolean;
}

interface DaYunGroup {
  key: string;
  label: string;
  daYun: DaYunCycle | null;
  startAge: number;
  endAge: number;
  years: YearDetail[];
}

interface Props {
  report: FullDestinyReport;
  birth: TiebanInput;
  collapse?: CollapseResult;
}

const TEN_GOD_GOOD = ['正官', '正印', '正财', '食神', '偏财'];
const TEN_GOD_BAD = ['七杀', '劫财', '伤官'];

function tenGodTone(tenGod: string): 'good' | 'bad' | 'neutral' {
  if (TEN_GOD_GOOD.includes(tenGod)) return 'good';
  if (TEN_GOD_BAD.includes(tenGod)) return 'bad';
  return 'neutral';
}

export function YearByYearPanel({ report, birth, collapse }: Props) {
  const { lang, dimLabel } = useI18n();
  const zh = lang === 'zh';

  const baziChart: BaziChart | null = useMemo(() => {
    try {
      return calculateBaziChart({
        birthLocalDateTime: {
          year: birth.year, month: birth.month, day: birth.day,
          hour: birth.hour, minute: birth.minute,
        },
        gender: birth.gender,
        geoLatitude: birth.geoLatitude,
        geoLongitude: birth.geoLongitude,
        timezoneOffsetMinutes: birth.timezoneOffsetMinutes,
        targetYear: birth.year + 1,
      });
    } catch {
      return null;
    }
  }, [birth]);

  const ziweiLiunianByYear = useMemo(() => {
    const map = new Map<number, LiunianStep>();
    try {
      const chart = calculateZiweiChart({
        birthLocalDateTime: {
          year: birth.year, month: birth.month, day: birth.day,
          hour: birth.hour, minute: birth.minute,
        },
        gender: birth.gender,
        targetYear: birth.year + 1,
        liunianRangeBefore: 0,
        liunianRangeAfter: 99,
      });
      for (const step of chart.liunian) map.set(step.year, step);
    } catch {
      // ziwei chart failure degrades gracefully — column stays empty
    }
    return map;
  }, [birth]);

  const eventsByAge = useMemo(() => {
    const map = new Map<number, CollapsedPathNode[]>();
    for (const node of collapse?.collapsedPath ?? []) {
      const list = map.get(node.age) ?? [];
      list.push(node);
      map.set(node.age, list);
    }
    return map;
  }, [collapse]);

  const analysisHorizonAge = collapse?.planningHorizonAge ?? 80;

  const groups: DaYunGroup[] = useMemo(() => {
    const maxAge = Math.min(
      analysisHorizonAge,
      report.flowYears.length > 0 ? report.flowYears[report.flowYears.length - 1].age : 80,
    );

    const details: YearDetail[] = report.flowYears
      .filter(fy => fy.age <= maxAge)
      .map(fy => {
        let baziFlowYear: FlowYearInfo | null = null;
        if (baziChart) {
          try {
            baziFlowYear = analyzeFlowYear(baziChart, { targetYear: fy.year });
          } catch {
            baziFlowYear = null;
          }
        }
        return {
          age: fy.age,
          year: fy.year,
          tieban: fy,
          daYun: report.lifeCycles.find(c => fy.age >= c.startAge && fy.age <= c.endAge) ?? null,
          baziFlowYear,
          ziweiLiunian: ziweiLiunianByYear.get(fy.year) ?? null,
          events: eventsByAge.get(fy.age) ?? [],
          isTerminalYear: collapse != null && fy.age === collapse.terminalAge,
        };
      });

    const result: DaYunGroup[] = [];
    const preDaYun = details.filter(d => !d.daYun);
    if (preDaYun.length > 0) {
      result.push({
        key: 'pre',
        label: zh ? '童限（大运前）' : 'Pre-Cycle (Childhood)',
        daYun: null,
        startAge: preDaYun[0].age,
        endAge: preDaYun[preDaYun.length - 1].age,
        years: preDaYun,
      });
    }
    report.lifeCycles.forEach((cycle, i) => {
      const years = details.filter(d => d.daYun === cycle);
      if (years.length === 0) return;
      result.push({
        key: `dy-${i}`,
        label: cycle.isChildhood
          ? (zh ? `童限（未起运 ${cycle.startAge}-${cycle.endAge}岁）` : `Childhood (pre-cycle, age ${cycle.startAge}-${cycle.endAge})`)
          : zh
            ? `第${i + 1}大运 ${cycle.ganZhi}（${cycle.naYin ?? ''}）`
            : `Cycle ${i + 1} ${cycle.ganZhi} (${cycle.naYin ?? ''})`,
        daYun: cycle,
        startAge: cycle.startAge,
        endAge: cycle.endAge,
        years,
      });
    });
    return result;
  }, [report, baziChart, ziweiLiunianByYear, eventsByAge, analysisHorizonAge, collapse, zh]);

  // currentAge only affects highlighting, never engine computation.
  const currentAge = new Date().getFullYear() - birth.year;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const g = groups.find(gr => currentAge >= gr.startAge && currentAge <= gr.endAge) ?? groups[0];
    return new Set(g ? [g.key] : []);
  });
  const [clauseTexts, setClauseTexts] = useState<Map<number, string>>(new Map());
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const loadGroupClauses = useCallback(async (group: DaYunGroup) => {
    const missing = group.years
      .map(y => y.tieban.clauseNumber)
      .filter(n => !clauseTexts.has(n));
    if (missing.length === 0) return;
    setLoadingGroups(prev => new Set(prev).add(group.key));
    const clauses = await fetchClausesByNumbers(missing);
    setClauseTexts(prev => {
      const next = new Map(prev);
      for (const c of clauses) next.set(c.clause_number, c.content);
      return next;
    });
    setLoadingGroups(prev => {
      const next = new Set(prev);
      next.delete(group.key);
      return next;
    });
  }, [clauseTexts]);

  useEffect(() => {
    for (const g of groups) {
      if (openGroups.has(g.key)) void loadGroupClauses(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGroups, groups]);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalYears = groups.reduce((s, g) => s + g.years.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <HolographicPanel innerPadding="md">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-sm font-serif text-foreground">
            {zh ? '逐年规则分析 · 有限窗口' : 'Year-by-Year Rule Analysis · Finite Horizon'}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/60 font-sans">
          <span>{zh ? '覆盖年份' : 'Years'} <strong className="text-foreground/80">{totalYears}</strong></span>
          <span>{zh ? '大运周期' : 'Cycles'} <strong className="text-foreground/80">{report.lifeCycles.length}</strong></span>
          <span>{zh ? '分析窗口' : 'Analysis horizon'} <strong className="text-accent">0–{analysisHorizonAge}{zh ? '岁' : ''}</strong></span>
          <span>{zh ? '数据源' : 'Sources'} <strong className="text-primary">{zh ? '铁板条文 · 八字流年/流月 · 紫微流年 · 情景融合' : 'Tieban · Bazi · Ziwei · Scenario fusion'}</strong></span>
        </div>
      </HolographicPanel>

      {/* Da Yun groups */}
      {groups.map(group => {
        const isOpen = openGroups.has(group.key);
        const isLoading = loadingGroups.has(group.key);
        const isCurrent = currentAge >= group.startAge && currentAge <= group.endAge;
        return (
          <div key={group.key} className={`rounded-xl border overflow-hidden ${isCurrent ? 'border-primary/40 bg-primary/[0.03]' : 'border-border/30 bg-card/20'}`}>
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                  <span className="text-sm font-serif text-foreground/85 truncate">{group.label}</span>
                  <span className="text-[10px] text-muted-foreground/40 font-sans shrink-0">
                    {group.startAge}-{group.endAge}{zh ? '岁' : ''}
                  </span>
                  {isCurrent && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-[9px] px-1.5 shrink-0">
                      {zh ? '当前' : 'Now'}
                    </Badge>
                  )}
                </div>
                {group.daYun?.dayMasterRelation && (
                  <span className="text-[10px] text-muted-foreground/50 font-sans shrink-0">
                    {zh ? '与日主' : 'vs DM'}: {group.daYun.dayMasterRelation}
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-border/10 pt-3">
                {group.years.map(yd => (
                  <YearRow
                    key={yd.age}
                    detail={yd}
                    clauseText={clauseTexts.get(yd.tieban.clauseNumber)}
                    isLoadingClause={isLoading && !clauseTexts.has(yd.tieban.clauseNumber)}
                    isCurrent={yd.age === currentAge}
                    isExpanded={expandedYear === yd.age}
                    onToggle={() => setExpandedYear(prev => prev === yd.age ? null : yd.age)}
                    baziChart={baziChart}
                    zh={zh}
                    dimLabel={dimLabel}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function YearRow({
  detail, clauseText, isLoadingClause, isCurrent, isExpanded, onToggle, baziChart, zh, dimLabel,
}: {
  detail: YearDetail;
  clauseText?: string;
  isLoadingClause: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  baziChart: BaziChart | null;
  zh: boolean;
  dimLabel: (d: FateDimension) => string;
}) {
  const fy = detail.baziFlowYear;
  const tone = fy ? tenGodTone(String(fy.tenGod)) : 'neutral';
  const hasRisk = (fy?.riskFlags.length ?? 0) > 0 || (fy?.clashes.length ?? 0) > 0;
  const hasOpportunity = (fy?.opportunityFlags.length ?? 0) > 0;
  const majorEvent = detail.events.some(e =>
    e.event.intensity === 'major' || e.event.intensity === 'critical' || e.event.intensity === 'life_defining');

  return (
    <div className={`rounded-lg border transition-all ${
      detail.isTerminalYear ? 'border-sky-500/30 bg-sky-500/5'
      : isCurrent ? 'border-primary/50 bg-primary/10'
      : isExpanded ? 'border-primary/25 bg-card/40'
      : 'border-border/20 bg-card/20 hover:border-primary/20'
    }`}>
      {/* Summary row */}
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-start gap-3">
          <div className="text-center min-w-[48px]">
            <div className={`text-lg font-serif ${isCurrent ? 'text-primary' : 'text-foreground/80'}`}>{detail.age}</div>
            <div className="text-[9px] text-muted-foreground/40 font-sans">{detail.year}</div>
            <div className="text-[10px] text-muted-foreground/60 font-serif">{detail.tieban.ganZhi}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {fy && (
                <Badge variant="outline" className={`text-[9px] px-1.5 ${
                  tone === 'good' ? 'border-emerald-500/40 text-emerald-400'
                  : tone === 'bad' ? 'border-rose-500/40 text-rose-400'
                  : 'border-border/40 text-muted-foreground/60'
                }`}>
                  {String(fy.tenGod)}
                </Badge>
              )}
              {detail.tieban.naYin && (
                <span className="text-[9px] text-muted-foreground/45 font-sans">{detail.tieban.naYin}</span>
              )}
              {detail.ziweiLiunian && (
                <span className="text-[9px] text-violet-400/70 font-sans">
                  {zh ? '紫微流年宫' : 'Ziwei'}: {detail.ziweiLiunian.palaceName}
                </span>
              )}
              {hasRisk && (
                <Badge variant="outline" className="text-[9px] px-1.5 border-rose-500/30 text-rose-400/80">
                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />{zh ? '风险' : 'Risk'}
                </Badge>
              )}
              {hasOpportunity && (
                <Badge variant="outline" className="text-[9px] px-1.5 border-emerald-500/30 text-emerald-400/80">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />{zh ? '机遇' : 'Opportunity'}
                </Badge>
              )}
              {majorEvent && (
                <Badge className="text-[9px] px-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {zh ? '重大事件' : 'Major Event'}
                </Badge>
              )}
              {detail.isTerminalYear && (
                <Badge variant="outline" className="text-[9px] px-1.5 border-sky-500/40 text-sky-300/80">
                  {zh ? '模型边界' : 'Model boundary'}
                </Badge>
              )}
            </div>
            {/* Clause preview */}
            {isLoadingClause ? (
              <Skeleton className="h-3.5 w-3/4 bg-muted/30" />
            ) : clauseText ? (
              <p className={`text-[11px] font-serif text-foreground/65 leading-relaxed ${isExpanded ? '' : 'line-clamp-1'}`}>
                {clauseText}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground/35 font-sans">
                {zh ? `条文 #${detail.tieban.clauseNumber}（待载入）` : `Clause #${detail.tieban.clauseNumber} (pending)`}
              </p>
            )}
          </div>
          <div className="shrink-0 pt-1">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/10 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Tieban clause */}
          <YearSection icon={<Scroll className="w-3 h-3" />} title={zh ? '铁板流年条文' : 'Tieban Flow-Year Clause'}>
            <div className="text-[11px] font-serif text-foreground/75 leading-relaxed">
              {clauseText ?? (zh ? '条文载入中…' : 'Loading clause…')}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-[9px] text-muted-foreground/45 font-sans">
              <span>{zh ? '条文号' : 'Clause'} #{detail.tieban.clauseNumber}</span>
              {detail.tieban.naYin && <span>{zh ? '纳音' : 'Na Yin'} {detail.tieban.naYin}</span>}
              {detail.tieban.taiXuanMultiplier != null && <span>{zh ? '太玄乘数' : 'Tai Xuan'} {detail.tieban.taiXuanMultiplier}</span>}
            </div>
          </YearSection>

          {/* Bazi flow year */}
          {fy && (
            <YearSection icon={<BookOpen className="w-3 h-3" />} title={zh ? '八字流年分析' : 'Bazi Flow-Year Analysis'}>
              <div className="space-y-1">
                {fy.relationToNatal.map((r, i) => (
                  <div key={i} className="text-[10px] text-foreground/60 font-sans">{r}</div>
                ))}
                {fy.affectedPillars.length > 0 && (
                  <div className="text-[10px] text-amber-400/70 font-sans">
                    {zh ? '受影响柱位' : 'Affected pillars'}: {fy.affectedPillars.join('、')}
                  </div>
                )}
                {fy.riskFlags.map((r, i) => (
                  <div key={`r${i}`} className="text-[10px] text-rose-400/75 font-sans">⚠ {r}</div>
                ))}
                {fy.opportunityFlags.map((o, i) => (
                  <div key={`o${i}`} className="text-[10px] text-emerald-400/75 font-sans">↗ {o}</div>
                ))}
              </div>
              {detail.daYun && (
                <div className="mt-1.5 text-[9px] text-muted-foreground/45 font-sans">
                  {zh ? '所属大运' : 'Da Yun'}: {detail.daYun.ganZhi}（{detail.daYun.naYin ?? ''}）{detail.daYun.dayMasterRelation ? ` · ${detail.daYun.dayMasterRelation}` : ''}
                </div>
              )}
            </YearSection>
          )}

          {/* Ziwei liunian */}
          {detail.ziweiLiunian && (
            <YearSection icon={<Sparkles className="w-3 h-3" />} title={zh ? '紫微流年' : 'Ziwei Flow-Year'}>
              <div className="text-[10px] text-foreground/60 font-sans mb-1">
                {zh ? '流年宫' : 'Palace'}: <span className="text-violet-400/80">{detail.ziweiLiunian.palaceName}</span>
                {' @ '}{detail.ziweiLiunian.branch}
                {detail.ziweiLiunian.stars.length > 0 && (
                  <span className="ml-2">
                    {zh ? '主星' : 'Stars'}: {detail.ziweiLiunian.stars.slice(0, 6).map(s => s.name).join('、')}
                  </span>
                )}
              </div>
              {detail.ziweiLiunian.sihua.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detail.ziweiLiunian.sihua.map((s, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400/80 border border-violet-500/20 font-sans">
                      {s.star}化{s.transform}
                    </span>
                  ))}
                </div>
              )}
            </YearSection>
          )}

          {/* Deterministically ranked scenario events */}
          {detail.events.length > 0 && (
            <YearSection icon={<Atom className="w-3 h-3" />} title={zh ? '规则融合情景' : 'Rule-Fusion Scenarios'}>
              <div className="space-y-2">
                {detail.events.map((node, i) => (
                  <div key={i} className="rounded-md border border-border/15 bg-card/30 p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-border/20 text-muted-foreground/50 font-sans">{node.event.category}</span>
                      <span className="text-[8px] text-muted-foreground/40 font-sans">{node.event.intensity}</span>
                    </div>
                    <p className="text-[11px] text-foreground/65 font-sans leading-relaxed">{node.event.description}</p>
                    {Object.keys(node.event.fateImpact).length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {(Object.entries(node.event.fateImpact) as [FateDimension, number][])
                          .filter(([, v]) => Math.abs(v) > 0)
                          .map(([dim, v]) => (
                            <span key={dim} className={`text-[8px] px-1 py-0.5 rounded font-sans ${
                              v > 0 ? 'bg-emerald-500/10 text-emerald-400/70' : 'bg-rose-500/10 text-rose-400/70'
                            }`}>
                              {dimLabel(dim)} {v > 0 ? '+' : ''}{v}
                            </span>
                          ))}
                      </div>
                    )}
                    {node.engineSupports.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {node.engineSupports.map(e => (
                          <span key={e} className="text-[7px] px-1 py-0.5 rounded-full border border-border/10 text-muted-foreground/35 font-sans">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </YearSection>
          )}

          {/* Flow months */}
          {baziChart && <FlowMonthGrid baziChart={baziChart} year={detail.year} zh={zh} />}
        </div>
      )}
    </div>
  );
}

function YearSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 text-primary/70">
        {icon}
        <span className="text-[10px] font-sans uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function FlowMonthGrid({ baziChart, year, zh }: { baziChart: BaziChart; year: number; zh: boolean }) {
  const [show, setShow] = useState(false);

  const months: FlowMonthInfo[] = useMemo(() => {
    if (!show) return [];
    const list: FlowMonthInfo[] = [];
    for (let m = 1; m <= 12; m++) {
      try {
        list.push(analyzeFlowMonth(baziChart, { targetYear: year, targetMonth: m }));
      } catch {
        // skip month on failure
      }
    }
    return list;
  }, [show, baziChart, year]);

  return (
    <div>
      <button
        onClick={() => setShow(s => !s)}
        className="flex items-center gap-1.5 text-[10px] font-sans text-primary/70 hover:text-primary transition-colors"
      >
        {show ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {zh ? `查看 ${year} 年逐月流月明细` : `Show monthly detail for ${year}`}
      </button>
      {show && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mt-2">
          {months.map(fm => {
            const tone = tenGodTone(String(fm.tenGod));
            const hasFlag = fm.riskFlags.length > 0 || fm.opportunityFlags.length > 0 || fm.clashes.length > 0;
            return (
              <div key={fm.month} className={`rounded-md border p-2 ${
                fm.riskFlags.length > 0 || fm.clashes.length > 0 ? 'border-rose-500/20 bg-rose-500/[0.03]'
                : fm.opportunityFlags.length > 0 ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                : 'border-border/15 bg-card/20'
              }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-serif text-foreground/75">
                    {fm.month}{zh ? '月' : ''} {fm.ganZhi}
                  </span>
                  <span className={`text-[9px] font-sans ${
                    tone === 'good' ? 'text-emerald-400/80' : tone === 'bad' ? 'text-rose-400/80' : 'text-muted-foreground/50'
                  }`}>
                    {String(fm.tenGod)}
                  </span>
                </div>
                {fm.clashes.map((c, i) => (
                  <div key={`c${i}`} className="text-[9px] text-rose-400/70 font-sans">冲: {c}</div>
                ))}
                {fm.combinations.map((c, i) => (
                  <div key={`h${i}`} className="text-[9px] text-emerald-400/60 font-sans">合: {c}</div>
                ))}
                {fm.riskFlags.map((r, i) => (
                  <div key={`r${i}`} className="text-[9px] text-rose-400/70 font-sans">⚠ {r}</div>
                ))}
                {fm.opportunityFlags.map((o, i) => (
                  <div key={`o${i}`} className="text-[9px] text-emerald-400/70 font-sans">↗ {o}</div>
                ))}
                {!hasFlag && (
                  <div className="text-[9px] text-muted-foreground/35 font-sans">{zh ? '平顺' : 'Stable'}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
