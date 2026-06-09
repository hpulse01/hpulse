/**
 * P4.7 — Qi Men Dun Jia 时家奇门 deterministic calculator.
 *
 * Workflow:
 *   1. Normalize query time → astro-time → 四柱 (年月日时干支).
 *   2. Solar term + 三元 + 符头 → 阳/阴遁 + 局数.
 *   3. 三奇六仪 地盘排布.
 *   4. 旬首 → 值符星 / 值使门.
 *   5. 九星转盘 (随时干).
 *   6. 八门转盘 (随时支).
 *   7. 八神排布 (顺/逆).
 *   8. 用神宫判断.
 *   9. 完整 explanationTrace.
 *
 * 高级格局 (奇门十干克应、三奇得使、伏吟反吟、击刑入墓 etc.) 标记 partial.
 */
import type {
  QimenInput, QimenChart, QimenWarning, ExplanationStep,
  PalaceCell, PalaceNumber, YongShenAssignment,
} from './types';
import { normalizeBirthTime } from '../astro-time/normalizeBirthTime';
import { fourPillarsFromAstro } from '../calendar/fourPillars';
import { previousSolarTerm } from '../calendar/solarTerms';
import { resolveJu } from './ju';
import { placeSanQiLiuYi } from './stems';
import { resolveXunShou } from './zhifuZhishi';
import { rotateStars } from './stars';
import { rotateGates } from './gates';
import { placeDeities } from './deities';
import { PALACE_META, YONG_SHEN_MAP } from './constants';
import { rotateHeavenStems, detectQimenPatterns, detectFuYinFanYin } from './advancedPatterns';

export function calculateQimenChart(input: QimenInput): QimenChart {
  const trace: ExplanationStep[] = [];
  const warnings: QimenWarning[] = [];

  if (!input.queryTimeUtc || !input.timezoneIana) {
    throw new Error('Qimen requires queryTimeUtc + timezoneIana');
  }

  // 1. Normalize → 四柱
  const utc = new Date(input.queryTimeUtc);
  if (Number.isNaN(utc.getTime())) {
    throw new Error('Qimen: invalid queryTimeUtc');
  }

  // Local wall clock (for civil hour)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timezoneIana,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  });
  const parts = fmt.formatToParts(utc).reduce((m, p) => { m[p.type] = p.value; return m; }, {} as Record<string, string>);
  const local = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
  };

  const lat = input.geoLatitude ?? 39.9042;   // default Beijing
  const lon = input.geoLongitude ?? 116.4074;
  if (input.geoLatitude === undefined || input.geoLongitude === undefined) {
    warnings.push({
      code: 'qimen.geo.default',
      message: '未提供 geoLatitude/geoLongitude，回退到北京坐标 (39.9042,116.4074)。时柱可能略有偏差。',
      level: 'warn',
    });
  }

  const astro = normalizeBirthTime({
    birthLocalDateTime: local,
    geoLatitude: lat,
    geoLongitude: lon,
    timezoneIana: input.timezoneIana,
    birthUtcDateTime: input.queryTimeUtc,
  });
  const fp = fourPillarsFromAstro(astro);
  trace.push({
    rule: 'qimen.fourPillars',
    detail: `四柱：年=${fp.year.ganzhi} 月=${fp.month.ganzhi} 日=${fp.day.ganzhi} 时=${fp.hour.ganzhi}。`,
    data: {
      year: fp.year.ganzhi, month: fp.month.ganzhi, day: fp.day.ganzhi, hour: fp.hour.ganzhi,
    },
  });

  // 2. Solar term + Ju
  const term = previousSolarTerm(utc);
  trace.push({
    rule: 'qimen.solarTerm',
    detail: `最近节气=${term.name} @ ${term.utc.toISOString()}.`,
    data: { name: term.name, utc: term.utc.toISOString() },
  });

  const ju = resolveJu(term.name, fp.day.ganzhi, trace, warnings);

  // 3. 三奇六仪 地盘
  const earthLayout = placeSanQiLiuYi(ju.juNumber, ju.dunDirection, trace);

  // 4. 旬首 + 值符 / 值使
  const xs = resolveXunShou(fp.hour.ganzhi, trace);

  // 5. 九星转盘
  const starResult = rotateStars(earthLayout, xs.xunShouYi, xs.effectiveStemForRotation, ju.dunDirection, trace);

  // 6. 八门转盘
  // hourBranch is already a parsed CN char from xs.hourBranch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gateResult = rotateGates(earthLayout, xs.xunShouYi, xs.hourBranch as any, ju.dunDirection, trace);

  // 7. 八神 — 起点为 值符星 当前所在宫 (即 hourStemPalace)
  const deityAt = placeDeities(starResult.hourStemPalace, ju.dunDirection, trace);

  // 7b. 天盘干转换（与九星同步移位）
  const heavenLayout = rotateHeavenStems(earthLayout, starResult.shift, ju.dunDirection, trace);

  // 8. 装配 9 宫
  const palaces: PalaceCell[] = ([1,2,3,4,5,6,7,8,9] as PalaceNumber[]).map((p) => ({
    palace: p,
    trigram: PALACE_META[p].trigram,
    direction: PALACE_META[p].direction,
    element: PALACE_META[p].element,
    earthStem: earthLayout[p] ?? null,
    heavenStem: heavenLayout[p] ?? null,
    star: starResult.starAtPalace[p] ?? null,
    gate: gateResult.gateAtPalace[p] ?? null,
    deity: deityAt[p] ?? null,
  }));

  // 8b. 格局识别 + 伏吟反吟
  const patterns = detectQimenPatterns(palaces, trace);
  const fuYinFanYin = detectFuYinFanYin(starResult.shift, trace);

  // 9. 用神宫
  const yongShen = decideYongShen(input, palaces, trace);

  // confidence: 基础 + 用神 + 格局净影响（限幅） + 伏反吟调整
  const patternNet = patterns.reduce((s, p) => s + p.impact, 0);
  const patternAdj = Math.max(-8, Math.min(8, Math.round(patternNet / 3)));
  const confidence = Math.max(10, Math.min(95,
    72 + (yongShen.primaryPalace ? 5 : -10) + patternAdj + fuYinFanYin.scoreAdjustment));
  const completenessScore = 0.85;

  return {
    input,
    yearGanzhi: fp.year.ganzhi,
    monthGanzhi: fp.month.ganzhi,
    dayGanzhi: fp.day.ganzhi,
    hourGanzhi: fp.hour.ganzhi,
    solarTerm: ju.solarTerm,
    dunDirection: ju.dunDirection,
    threeYuan: ju.threeYuan,
    fuTouDay: ju.fuTouDay,
    fuTouBranchGroup: ju.fuTouBranchGroup,
    juNumber: ju.juNumber,
    hourXunShou: xs.xunShou,
    hourXunShouYi: xs.xunShouYi,
    zhiFuStar: starResult.zhiFuStar,
    zhiShiGate: gateResult.zhiShiGate,
    zhiFuOriginPalace: starResult.zhiFuOriginPalace,
    zhiShiOriginPalace: gateResult.zhiShiOriginPalace,
    palaces,
    yongShen,
    patterns,
    fuYinFanYin,
    confidence,
    completenessScore,
    sourceGrade: 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}

function decideYongShen(
  input: QimenInput,
  palaces: PalaceCell[],
  trace: ExplanationStep[],
): YongShenAssignment {
  const cat = input.yongShenCategory ?? '其他';
  const map = YONG_SHEN_MAP[cat] ?? YONG_SHEN_MAP['其他'];

  let palace: PalaceNumber | null = null;
  for (const cell of palaces) {
    if (map.target === 'gate' && cell.gate === map.symbol) { palace = cell.palace; break; }
    if (map.target === 'star' && cell.star === map.symbol) { palace = cell.palace; break; }
    if (map.target === 'deity' && cell.deity === map.symbol) { palace = cell.palace; break; }
    if (map.target === 'stem' && cell.earthStem === map.symbol) { palace = cell.palace; break; }
  }

  trace.push({
    rule: 'qimen.yongShen',
    detail: `用神类别=${cat} → 取${map.target === 'gate' ? '八门' : map.target === 'star' ? '九星' : map.target === 'deity' ? '八神' : '天干'}「${map.symbol}」所在宫=${palace ?? '不现'}。`,
    data: { category: cat, target: map.target, symbol: map.symbol, palace },
  });

  return {
    category: cat,
    primaryPalace: palace,
    primaryTarget: map.target,
    primarySymbol: map.symbol,
    rationale: `按${cat}类别选取${map.symbol}为用神，落于${palace ? `${palace}宫(${palaces[palace-1].direction}/${palaces[palace-1].trigram})` : '不现'}。`,
  };
}
