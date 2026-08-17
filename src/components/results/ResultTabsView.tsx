import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Atom, RotateCcw, Sparkles, Scroll, TreePine, Layers, Shield,
  AlertTriangle, ArrowLeft, Activity, BookOpen, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { useHPulsePipeline } from '@/hpulse/react';
import type { UnifiedReport } from '@/hooks/usePredictionFlow';
import type {
  TiebanInput,
  KaoKeWithMatch,
  CalibrationResult,
  FullDestinyReport,
} from '@/utils/tiebanAlgorithm';
import type { QuantumPredictionResult } from '@/utils/quantumPredictionEngine';

import { DestinyDashboard } from '@/components/DestinyDashboard';
import { UnifiedQuantumPanel } from '@/components/UnifiedQuantumPanel';
import { AdminOrchestrationConsole } from '@/components/AdminOrchestrationConsole';
import { PredictionOverview } from '@/components/results/PredictionOverview';
import { EngineContributionPanel } from '@/components/results/EngineContributionPanel';
import { DestinyTreeLayer } from '@/components/results/DestinyTreeLayer';
import { UniquePathLayer } from '@/components/results/UniquePathLayer';
import { HolographicFateMapPanel } from '@/components/results/HolographicFateMapPanel';
import { YearByYearPanel } from '@/components/results/YearByYearPanel';
import { AuditTracePanel } from '@/components/results/audit/AuditTracePanel';
import { BaziCorePanel } from '@/components/results/bazi/BaziCorePanel';
import { TiebanCorePanel } from '@/components/results/tieban/TiebanCorePanel';
import { ZiweiCorePanel } from '@/components/results/ziwei/ZiweiCorePanel';
import { LiuYaoCorePanel } from '@/components/results/liuyao/LiuYaoCorePanel';
import { MeihuaCorePanel } from '@/components/results/meihua/MeihuaCorePanel';
import { QimenCorePanel } from '@/components/results/qimen/QimenCorePanel';
import { LiuRenCorePanel } from '@/components/results/liuren/LiuRenCorePanel';
import { TaiyiCorePanel } from '@/components/results/taiyi/TaiyiCorePanel';
import { WesternCorePanel } from '@/components/results/western/WesternCorePanel';
import { VedicCorePanel } from '@/components/results/vedic/VedicCorePanel';
import { NumerologyCorePanel } from '@/components/results/numerology/NumerologyCorePanel';
import { MayanCorePanel } from '@/components/results/mayan/MayanCorePanel';
import { KabbalahCorePanel } from '@/components/results/kabbalah/KabbalahCorePanel';
import { QuantumCollapsePanel } from '@/components/results/quantum-collapse/QuantumCollapsePanel';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { ResultShell } from '@/components/hpulse/ResultShell';
import { HPulseProjectionPanel } from '@/components/hpulse/HPulseProjectionPanel';
import { EventTimelinePanel } from '@/components/hpulse/EventTimelinePanel';

interface ResultTabsViewProps {
  quantumResult: QuantumPredictionResult;
  unifiedReport: UnifiedReport | null;
  fullReport: FullDestinyReport;
  birthInput: TiebanInput;
  ganZhiDisplay: string;
  baseNumber: number;
  theoreticalBase: number;
  calibrationResult: CalibrationResult | null;
  selectedKaoKe: KaoKeWithMatch | null;
  hpulse: ReturnType<typeof useHPulsePipeline>;
  onReset: () => void;
}

const TAB_TRIGGER_CLASS =
  'text-[11px] sm:text-xs py-2 px-3 rounded-lg font-sans whitespace-nowrap data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(40_65%_55%_/_0.25)] data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all';

/** Full result view: quantum-signature shell + public/admin tab panels. */
export function ResultTabsView({
  quantumResult,
  unifiedReport,
  fullReport,
  birthInput,
  ganZhiDisplay,
  baseNumber,
  theoreticalBase,
  calibrationResult,
  selectedKaoKe,
  hpulse,
  onReset,
}: ResultTabsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { isSuperAdmin } = useAdminAccess();
  const { profile } = useAuth();
  const { t, lang } = useI18n();

  const resultTabs = useMemo(() => {
    // Public tabs — visible to all users
    const publicTabs = [
      { id: 'overview', label: t('tab.overview'), icon: Sparkles },
      { id: 'engines', label: t('tab.engines'), icon: Layers },
    ];
    // Unvalidated or sensitive projections stay in the super-admin audit surface.
    const adminAlgoTabs = [
      { id: 'holographic', label: lang === 'zh' ? '全息命盘' : 'Holographic Map', icon: Layers },
      { id: 'tree', label: lang === 'zh' ? '命运树·唯一路径' : 'Destiny Tree & Path', icon: TreePine },
      { id: 'yearly', label: lang === 'zh' ? '逐年详批' : 'Yearly Detail', icon: CalendarDays },
      { id: 'destiny', label: lang === 'zh' ? '铁板命盘' : 'Destiny Chart', icon: Scroll },
      { id: 'quantum', label: t('tab.quantum'), icon: Atom },
      { id: 'tieban', label: lang === 'zh' ? '铁板' : 'Tieban', icon: Scroll },
      { id: 'bazi', label: lang === 'zh' ? '八字' : 'Bazi', icon: BookOpen },
      { id: 'ziwei', label: lang === 'zh' ? '紫微' : 'Ziwei', icon: Atom },
      { id: 'liuyao', label: lang === 'zh' ? '六爻' : 'Liu Yao', icon: Layers },
      { id: 'meihua', label: lang === 'zh' ? '梅花' : 'Meihua', icon: Layers },
      { id: 'qimen', label: lang === 'zh' ? '奇门' : 'Qi Men', icon: Layers },
      { id: 'liuren', label: lang === 'zh' ? '六壬' : 'Liu Ren', icon: Layers },
      { id: 'taiyi', label: lang === 'zh' ? '太乙' : 'Taiyi', icon: Layers },
      { id: 'western', label: lang === 'zh' ? '西方占星' : 'Western', icon: Atom },
      { id: 'vedic', label: lang === 'zh' ? '吠陀' : 'Vedic', icon: Atom },
      { id: 'numerology', label: lang === 'zh' ? '数字命理' : 'Numerology', icon: BookOpen },
      { id: 'mayan', label: lang === 'zh' ? '玛雅' : 'Mayan', icon: BookOpen },
      { id: 'kabbalah', label: lang === 'zh' ? '卡巴拉' : 'Kabbalah', icon: BookOpen },
      { id: 'quantumCollapse', label: lang === 'zh' ? '量子坍缩' : 'Quantum Collapse', icon: Atom },
      { id: 'audit', label: lang === 'zh' ? '算法审计' : 'Audit', icon: Activity },
    ];
    const tabs = isSuperAdmin ? [...publicTabs, ...adminAlgoTabs] : publicTabs;
    if (isSuperAdmin) {
      tabs.push({ id: 'orchestration', label: t('tab.orchestration'), icon: Shield });
    }
    return tabs;
  }, [isSuperAdmin, t, lang]);

  return (
    <div className="animate-fade-in-up">
      <ResultShell
        quantumSignature={quantumResult.quantumSignature}
        coherence={quantumResult.overallCoherence}
        worldsGenerated={quantumResult.totalWorldsGenerated}
        engineCount={13}
        dominantElement={quantumResult.dominantElement}
        deathAge={isSuperAdmin ? quantumResult.collapseResult?.deathAge : undefined}
        ganZhiDisplay={ganZhiDisplay}
        lifeSummary={
          isSuperAdmin
            ? quantumResult.lifeSummary
            : unifiedReport?.dashboardPayload.causalSummary
              ?? '结果依据当前输入与算法版本生成，仅用于文化研究、娱乐与自我反思。'
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
            <TabsList className="inline-flex w-auto min-w-full bg-card/40 border border-primary/15 h-auto p-1 rounded-xl gap-1">
              {resultTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className={TAB_TRIGGER_CLASS}>
                    <Icon className="w-3.5 h-3.5 mr-1.5 inline" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <HPulseProjectionPanel
              status={hpulse.status}
              view={hpulse.view}
              error={hpulse.error}
              showSensitiveTerminus={isSuperAdmin}
            />
            <EventTimelinePanel
              collapseResult={quantumResult.collapseResult}
              birthYear={birthInput?.year ?? new Date().getFullYear()}
              birthMonth={birthInput?.month ?? 1}
              kaoKeVerified={selectedKaoKe !== null}
              showSensitiveTerminus={isSuperAdmin}
            />
            {quantumResult.unifiedResult && (
              <PredictionOverview result={unifiedReport?.dashboardPayload ?? quantumResult.unifiedResult} />
            )}
          </TabsContent>

          {isSuperAdmin && (() => {
            const engineOutput = (name: string) =>
              quantumResult.unifiedResult?.engineOutputs?.find(e => e.engineName === name);
            const adminEnginePanels: Array<[string, React.ReactNode]> = [
              ['bazi', <BaziCorePanel bazi={engineOutput('bazi')} />],
              ['tieban', (
                <TiebanCorePanel
                  engineOutput={engineOutput('tieban')}
                  fullReport={fullReport}
                  calibration={calibrationResult}
                  selectedKaoKe={selectedKaoKe}
                  baseNumber={baseNumber}
                  theoreticalBase={theoreticalBase}
                  pillarsDisplay={ganZhiDisplay}
                />
              )],
              ['ziwei', <ZiweiCorePanel engineOutput={engineOutput('ziwei')} birthYear={birthInput.year} />],
              ['liuyao', <LiuYaoCorePanel engineOutput={engineOutput('liuyao')} />],
              ['meihua', <MeihuaCorePanel engineOutput={engineOutput('meihua')} />],
              ['qimen', <QimenCorePanel engineOutput={engineOutput('qimen')} />],
              ['liuren', <LiuRenCorePanel engineOutput={engineOutput('liuren')} />],
              ['taiyi', <TaiyiCorePanel engineOutput={engineOutput('taiyi')} />],
              ['western', <WesternCorePanel engineOutput={engineOutput('western')} />],
              ['vedic', <VedicCorePanel engineOutput={engineOutput('vedic')} />],
              ['mayan', <MayanCorePanel engineOutput={engineOutput('mayan')} />],
              ['numerology', (
                <NumerologyCorePanel
                  engineOutput={engineOutput('numerology')}
                  userName={profile?.display_name ?? null}
                  currentYear={quantumResult.timestamp.getFullYear()}
                />
              )],
              ['kabbalah', <KabbalahCorePanel engineOutput={engineOutput('kabbalah')} userName={profile?.display_name ?? null} />],
            ];
            return adminEnginePanels.map(([id, panel]) => (
              <TabsContent key={id} value={id} className="mt-5">
                <HolographicPanel innerPadding="md">{panel}</HolographicPanel>
              </TabsContent>
            ));
          })()}

          <TabsContent value="engines" className="mt-5">
            {quantumResult.unifiedResult && (
              <EngineContributionPanel result={unifiedReport?.dashboardPayload ?? quantumResult.unifiedResult} />
            )}
          </TabsContent>

          {isSuperAdmin && (
          <TabsContent value="audit" className="mt-5">
            <HolographicPanel innerPadding="md">
              <AuditTracePanel engineOutputs={quantumResult.unifiedResult?.engineOutputs} />
            </HolographicPanel>
          </TabsContent>
          )}

          {isSuperAdmin && <TabsContent value="tree" className="mt-5 space-y-5">
            {quantumResult.destinyTree && quantumResult.collapseResult ? (
              <>
                <DestinyTreeLayer tree={quantumResult.destinyTree} collapse={quantumResult.collapseResult} />
                <UniquePathLayer collapse={quantumResult.collapseResult} birthYear={birthInput.year} />
              </>
            ) : (
              <HolographicPanel innerPadding="lg" className="text-center text-xs text-muted-foreground">
                {lang === 'zh' ? '命运树数据加载中...' : 'Loading destiny tree...'}
              </HolographicPanel>
            )}
          </TabsContent>}

          {isSuperAdmin && <TabsContent value="holographic" className="mt-5">
            <HolographicFateMapPanel
              map={quantumResult.holographicFateMap ?? null}
              birthYear={birthInput.year}
            />
          </TabsContent>}

          {isSuperAdmin && <TabsContent value="yearly" className="mt-5">
            <YearByYearPanel
              report={fullReport}
              birth={birthInput}
              collapse={quantumResult.collapseResult}
            />
          </TabsContent>}

          {isSuperAdmin && <TabsContent value="destiny" className="mt-5">
            <DestinyDashboard
              report={fullReport}
              pillarsDisplay={ganZhiDisplay}
              birthYear={birthInput.year}
              onReset={onReset}
            />
          </TabsContent>}
          {isSuperAdmin && <TabsContent value="quantum" className="mt-5">
            <UnifiedQuantumPanel result={quantumResult} birthYear={birthInput.year} />
          </TabsContent>}

          {isSuperAdmin && (
          <TabsContent value="quantumCollapse" className="mt-5">
            <HolographicPanel innerPadding="md">
              <QuantumCollapsePanel quantumResult={quantumResult} />
            </HolographicPanel>
          </TabsContent>
          )}

          {isSuperAdmin && unifiedReport && (
            <TabsContent value="orchestration" className="mt-5">
              <div className="space-y-4">
                <HolographicPanel innerPadding="md" className="border-accent/30">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="text-xs text-accent/90 font-sans">{t('admin.super_admin')}</span>
                  </div>
                </HolographicPanel>
                <AdminOrchestrationConsole profile={profile} snapshot={unifiedReport.adminSnapshot} />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer Actions */}
        <div className="space-y-3 pt-4">
          <HolographicPanel innerPadding="sm" className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-accent/85">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
                {t('disclaimer.title')}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/65 leading-relaxed font-sans max-w-3xl mx-auto">
              {t('disclaimer.text')}
            </p>
          </HolographicPanel>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="py-5 text-sm font-sans tracking-wider border-border/40 hover:border-primary/40 hover:bg-primary/5 rounded-xl"
            >
              <Link to="/prediction-history">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回控制台 · 预测档案
              </Link>
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="py-5 text-sm font-sans tracking-wider border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl group"
            >
              <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              重新启动推演
            </Button>
          </div>
        </div>
      </ResultShell>
    </div>
  );
}
