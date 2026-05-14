/**
 * P4.4 — Top-level Ziwei chart computation.
 *
 * Pure / deterministic / fully traced.
 * No `Math.random`, no `new Date()` (except parsing the explicit queryTimeUtc
 * that already came from the caller as deterministic input).
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type {
  ZiweiCoreInput,
  ZiweiChart,
  ZiweiPalace,
  ZiweiStar,
  ValidationFlags,
} from './types';
import { calculateZiweiLunarContext } from './lunarAdapter';
import { calculateMingShenGong, buildPalaceLayout } from './palaceLayout';
import { calculateMingGongStem, calculateWuxingJu } from './wuxingJu';
import {
  calculateZiweiPosition,
  calculateTianfuPosition,
  placeMajorStars,
} from './starPlacement';
import { calculateSihua, buildSihuaMap } from './fourTransformations';
import { placeAuxiliaryStars } from './auxiliaryStars';
import { scorePalace, evaluatePalace } from './brightness';
import { calculateDaxian } from './daxian';
import { calculateLiunian, resolveTargetYear } from './liunian';
import { detectPatterns } from './patterns';
import { analyzeZiweiStrength } from './strength';
import { analyzePalaces } from './analyzePalaces';

export function calculateZiweiChart(input: ZiweiCoreInput): ZiweiChart {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];
  const uncertaintyNotes: string[] = [];

  // 1. Lunar context
  const lunarCtx = calculateZiweiLunarContext(input);
  trace.push(...lunarCtx.explanationTrace);
  warnings.push(...lunarCtx.warnings);

  // 2. 命宫 + 身宫
  const mingShen = calculateMingShenGong(lunarCtx.lunarMonth, lunarCtx.hourBranchIndex);
  trace.push(...mingShen.explanationTrace);

  // 3. 12 palace layout
  const layout = buildPalaceLayout(mingShen.mingIndex, mingShen.shenIndex);
  trace.push(...layout.explanationTrace);

  // 4. 命宫天干 + 五行局
  const mingStemRes = calculateMingGongStem(lunarCtx.yearGan, mingShen.mingIndex);
  trace.push(...mingStemRes.explanationTrace);
  const wuxingJu = calculateWuxingJu(mingStemRes.stem, mingShen.mingGongBranch);
  trace.push(...wuxingJu.explanationTrace);
  warnings.push(...wuxingJu.warnings);
  if (wuxingJu.fallbackUsed) uncertaintyNotes.push('五行局查表失败，使用 fallback');

  // 5/6. 紫微 / 天府位置
  const ziweiPosition = calculateZiweiPosition(lunarCtx.lunarDay, wuxingJu.number);
  const tianfuPosition = calculateTianfuPosition(ziweiPosition);

  // 7. 四化 → sihuaMap → 主星安星
  const sihuaRes = calculateSihua(lunarCtx.yearGan);
  trace.push(...sihuaRes.explanationTrace);
  warnings.push(...sihuaRes.warnings);
  const sihuaMap = buildSihuaMap(sihuaRes.sihua);

  const majorStars = placeMajorStars(ziweiPosition, tianfuPosition, sihuaMap);
  trace.push(...majorStars.explanationTrace);

  // 8. 辅星 + 煞星 + 博士十二神
  const auxStars = placeAuxiliaryStars({
    yearGan: lunarCtx.yearGan,
    yearZhi: lunarCtx.yearZhi,
    lunarMonth: lunarCtx.lunarMonth,
    hourBranchIndex: lunarCtx.hourBranchIndex,
    sihuaMap,
  });
  trace.push(...auxStars.explanationTrace);

  // 9. Merge stars per branch
  const starsByBranch: Record<number, ZiweiStar[]> = {};
  for (const src of [majorStars.byBranchIndex, auxStars.byBranchIndex]) {
    for (const [k, v] of Object.entries(src)) {
      const i = Number(k);
      (starsByBranch[i] ??= []).push(...v);
    }
  }

  // 10. Build palaces with scoring + evaluation
  const palaces: ZiweiPalace[] = layout.palaces.map((entry) => {
    const stars = starsByBranch[entry.index] ?? [];
    const strength = scorePalace({ stars });
    const evalRes = evaluatePalace({ stars });
    return {
      name: entry.name,
      branch: entry.branch,
      index: entry.index,
      isMing: entry.isMing,
      isShen: entry.isShen,
      stars,
      majorStars: stars.filter(s => s.type === 'major'),
      minorStars: stars.filter(s => s.type === 'minor'),
      auxiliaryStars: stars.filter(s => s.type === 'auxiliary'),
      shaStars: stars.filter(s => s.type === 'sha'),
      sanFang: entry.sanFang,
      duiGong: entry.duiGong,
      strengthScore: strength.score,
      evaluation: evalRes.evaluation,
      interpretationKeys: evalRes.interpretationKeys,
    };
  });

  // 11. Backfill sihua palaces
  for (const sh of sihuaRes.sihua) {
    const palace = palaces.find(p => p.stars.some(s => s.name === sh.star));
    if (palace) {
      sh.palace = palace.name;
      sh.branch = palace.branch;
    }
  }

  // 12. 大限
  const daxian = calculateDaxian({
    palaces,
    mingIndex: mingShen.mingIndex,
    wuxingJuNumber: wuxingJu.number,
    gender: input.gender,
    yearGan: lunarCtx.yearGan,
  });
  trace.push(...daxian.explanationTrace);

  // 13. 流年 (deterministic)
  const tyRes = resolveTargetYear({ targetYear: input.targetYear, queryTimeUtc: input.queryTimeUtc });
  if (tyRes.warning) {
    warnings.push(tyRes.warning);
    uncertaintyNotes.push('流年序列缺失：未提供 targetYear 与 queryTimeUtc');
  }
  const liunian = calculateLiunian({
    targetYear: tyRes.year,
    birthYear: input.birthLocalDateTime.year,
    palaces,
    rangeBefore: input.liunianRangeBefore,
    rangeAfter: input.liunianRangeAfter,
  });
  trace.push(...liunian.explanationTrace);
  warnings.push(...liunian.warnings);

  // 14. Patterns
  const patternRes = detectPatterns(palaces, sihuaRes.sihua);
  trace.push(...patternRes.explanationTrace);

  // 15. Palace analysis
  const palaceAnalysis = analyzePalaces(palaces);

  // 16. Strength
  const strength = analyzeZiweiStrength(palaces, patternRes.patterns, wuxingJu);
  trace.push(...strength.explanationTrace);

  // ── Validation flags ──
  const validationFlags: ValidationFlags = { passed: [], failed: [], warnings: [] };
  // 14 主星全部落宫
  const all14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞',
                 '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  const placed = new Set<string>();
  for (const p of palaces) for (const s of p.majorStars) placed.add(s.name);
  const missing = all14.filter(n => !placed.has(n));
  if (missing.length === 0) validationFlags.passed.push('major14_all_placed');
  else { validationFlags.failed.push(`major14_missing:${missing.join(',')}`); warnings.push({ code: 'ZIWEI_MISSING_MAJOR_STARS', message: `主星未落宫: ${missing.join('、')}`, severity: 'error' }); }
  if (palaces.length === 12) validationFlags.passed.push('palaces_12'); else validationFlags.failed.push('palaces_count');
  if (sihuaRes.sihua.length === 4) validationFlags.passed.push('sihua_4'); else validationFlags.warnings.push('sihua_incomplete');
  if (daxian.steps.length === 12) validationFlags.passed.push('daxian_12_steps'); else validationFlags.warnings.push('daxian_step_count');
  if (tyRes.year != null) validationFlags.passed.push('liunian_target_year_present');
  else validationFlags.warnings.push('liunian_target_year_missing');

  // ── Implementation status / sourceGrade / confidence / completeness ──
  // 已实现：14 主星 + 主辅煞 + 博士十二神 + 四化 + 大限 + 流年 + 主要格局 + 评分.
  // 未实现：长生十二神细分、暗合、流月/流日、年杂耀(天哭天虚等)、复杂飞星互化.
  uncertaintyNotes.push('当前未覆盖：长生十二神 / 流月流日 / 年杂耀 / 多层飞星互化');
  uncertaintyNotes.push('星耀亮度采用经典固定表，不考虑日月反/星耀互动微调');

  let confidence = 0.72;
  if (wuxingJu.fallbackUsed) confidence -= 0.1;
  if (missing.length > 0) confidence -= 0.2;
  if (tyRes.year == null) confidence -= 0.05;
  confidence = Math.max(0.1, Math.min(0.95, confidence));

  const completenessScore = Math.round(
    (validationFlags.passed.length /
      (validationFlags.passed.length + validationFlags.failed.length + validationFlags.warnings.length)) *
      100,
  );

  const shenPalace = palaces.find(p => p.isShen);

  return {
    solarDate: lunarCtx.solarDate,
    lunarDate: lunarCtx.lunarDate,
    lunarYear: lunarCtx.lunarYear,
    lunarMonth: lunarCtx.lunarMonth,
    lunarDay: lunarCtx.lunarDay,
    isLeapMonth: lunarCtx.isLeapMonth,
    yearGan: lunarCtx.yearGan,
    yearZhi: lunarCtx.yearZhi,
    yearGanZhi: lunarCtx.yearGanZhi,
    monthGanZhi: lunarCtx.monthGanZhi,
    dayGanZhi: lunarCtx.dayGanZhi,
    hourBranch: lunarCtx.hourBranch,
    hourBranchIndex: lunarCtx.hourBranchIndex,
    mingGong: '命宫',
    shenGong: shenPalace?.name ?? '命宫',
    mingGongBranch: mingShen.mingGongBranch,
    shenGongBranch: mingShen.shenGongBranch,
    mingGongStem: mingStemRes.stem,
    wuxingJu,
    ziweiPosition,
    tianfuPosition,
    palaces,
    sihua: sihuaRes.sihua,
    daxian: daxian.steps,
    startDaxianAge: daxian.startAge,
    daxianDirection: daxian.direction,
    liunian: liunian.steps,
    patterns: patternRes.patterns,
    palaceAnalysis,
    strengthAnalysis: strength,
    implementationStatus: 'partial',
    sourceGrade: missing.length === 0 && !wuxingJu.fallbackUsed ? 'B' : 'C',
    confidence,
    completenessScore,
    warnings,
    uncertaintyNotes,
    explanationTrace: trace,
    validationFlags,
  };
}
