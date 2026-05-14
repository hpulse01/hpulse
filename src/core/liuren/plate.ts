/**
 * P4.8 — Liuren plate construction (天盘地盘) + 月将解析 + 四课 + 三传 (基础贼克法).
 */
import type {
  BranchCN, StemCN, MonthGeneral, PlateCell, FourClasses, ThreeTransmissions,
  ExplanationStep, LiurenWarning, TwelveDeity,
} from './types';
import {
  BRANCHES, MID_TERM_TO_GENERAL_BRANCH, MID_TERMS_ORDERED, BRANCH_TO_GENERAL,
  DAY_STEM_PALACE, NOBLE_PERSON_DAY, NOBLE_PERSON_NIGHT, DEITY_ORDER,
  STEM_ELEMENT, BRANCH_ELEMENT, ELEMENT_OVERCOMES,
} from './constants';

const branchIdx = (b: BranchCN) => BRANCHES.indexOf(b);

/**
 * Resolve 月将 from 最近中气 name. If the recent solar term name is a 节 (not 中气),
 * walk back to previous 中气.
 */
export function resolveMonthGeneral(
  recentTermName: string,
  trace: ExplanationStep[],
  warnings: LiurenWarning[],
): { general: MonthGeneral; branch: BranchCN } {
  let branch = MID_TERM_TO_GENERAL_BRANCH[recentTermName];
  let usedTerm = recentTermName;
  if (!branch) {
    // Map 节→上一中气. Order of 24 terms; we only need approximate prev mid-term.
    const PREV_MID: Record<string, string> = {
      '小寒':'冬至','立春':'大寒','惊蛰':'雨水','清明':'春分','立夏':'谷雨','芒种':'小满',
      '小暑':'夏至','立秋':'大暑','白露':'处暑','寒露':'秋分','立冬':'霜降','大雪':'小雪',
    };
    const prev = PREV_MID[recentTermName];
    if (prev) {
      branch = MID_TERM_TO_GENERAL_BRANCH[prev];
      usedTerm = prev;
    }
  }
  if (!branch) {
    warnings.push({
      code: 'liuren.monthGeneral.fallback',
      message: `节气 "${recentTermName}" 无法直接映射月将，回退为登明(亥)。`,
      level: 'warn',
    });
    branch = '亥';
    usedTerm = '雨水';
  }
  const general = BRANCH_TO_GENERAL[branch];
  trace.push({
    rule: 'liuren.monthGeneral',
    detail: `中气=${usedTerm} → 月将=${general}(${branch})。`,
    data: { recentTerm: recentTermName, midTerm: usedTerm, general, branch, midTermsOrder: MID_TERMS_ORDERED },
  });
  return { general, branch };
}

/**
 * 月将加时 → 天盘排布。
 * heaven_at_earth(e) = 月将 + (e - 占时) (mod 12)
 */
export function buildPlates(
  monthGeneralBranch: BranchCN,
  hourBranch: BranchCN,
  trace: ExplanationStep[],
): PlateCell[] {
  const mIdx = branchIdx(monthGeneralBranch);
  const hIdx = branchIdx(hourBranch);
  const cells: PlateCell[] = BRANCHES.map((earth, eIdx) => {
    const heavenIdx = (mIdx + (eIdx - hIdx) + 1200) % 12;
    return {
      earthBranch: earth,
      heavenBranch: BRANCHES[heavenIdx],
      deity: null,
    };
  });
  trace.push({
    rule: 'liuren.plates',
    detail: `月将${monthGeneralBranch}加占时${hourBranch}：天盘随地盘顺布；e.g. 地盘${hourBranch}上之天盘=${monthGeneralBranch}。`,
    data: {
      monthGeneralBranch, hourBranch,
      mapping: cells.map((c) => `${c.earthBranch}→${c.heavenBranch}`),
    },
  });
  return cells;
}

/** 取地盘上某支位的天盘支。 */
export function heavenOfEarth(plates: PlateCell[], earth: BranchCN): BranchCN {
  return plates[branchIdx(earth)].heavenBranch;
}

/**
 * 四课：
 *   1课: 干寄宫 (earth) → 干上神 (heaven above 寄宫)
 *   2课: 干上神 (作为新地盘) → heaven above it
 *   3课: 日支 (earth) → 支上神 (heaven above 日支)
 *   4课: 支上神 (作为新地盘) → heaven above it
 */
export function buildFourClasses(
  plates: PlateCell[],
  dayStem: StemCN,
  dayBranch: BranchCN,
  trace: ExplanationStep[],
): FourClasses {
  const ganJi = DAY_STEM_PALACE[dayStem];
  const ke1H = heavenOfEarth(plates, ganJi);
  const ke2H = heavenOfEarth(plates, ke1H);
  const ke3H = heavenOfEarth(plates, dayBranch);
  const ke4H = heavenOfEarth(plates, ke3H);

  const fc: FourClasses = {
    ke1: { earth: ganJi,    heaven: ke1H },
    ke2: { earth: ke1H,     heaven: ke2H },
    ke3: { earth: dayBranch,heaven: ke3H },
    ke4: { earth: ke3H,     heaven: ke4H },
  };
  trace.push({
    rule: 'liuren.fourClasses',
    detail: `四课：1课(${dayStem}寄${ganJi})上神=${ke1H}；2课(${ke1H})上神=${ke2H}；3课(支${dayBranch})上神=${ke3H}；4课(${ke3H})上神=${ke4H}。`,
    data: fc,
  });
  return fc;
}

/**
 * 三传发用 — 基础"贼克法"实现 + fallback。
 *   遍历四课 (1→4)，找出 上神克下神 (贼) 或 下神克上神 (克) 的关系，
 *   优先取「贼」(上克下) 为发用；若有多个，取首见。无则取 涉害/遥克 fallback (此处简化)。
 *   中传 = 初传作为新地盘的天盘上神；末传 = 中传作为新地盘的天盘上神。
 *   高级九宗门 (涉害/昴星/别责/八专/伏吟/反吟) 标记为 partial。
 */
export function deriveThreeTransmissions(
  plates: PlateCell[],
  fc: FourClasses,
  trace: ExplanationStep[],
  warnings: LiurenWarning[],
): ThreeTransmissions {
  const elemOf = (b: BranchCN) => BRANCH_ELEMENT[b];
  const overcomes = (a: BranchCN, b: BranchCN) => ELEMENT_OVERCOMES[elemOf(a)] === elemOf(b);

  const courses = [fc.ke1, fc.ke2, fc.ke3, fc.ke4];

  // 1. 上克下 (贼)
  let chu: BranchCN | null = null;
  let method: ThreeTransmissions['method'] = 'fallback';
  for (const c of courses) {
    if (overcomes(c.heaven, c.earth)) {
      chu = c.heaven;
      method = '贼克';
      break;
    }
  }
  // 2. 下克上 (克)
  if (!chu) {
    for (const c of courses) {
      if (overcomes(c.earth, c.heaven)) {
        chu = c.heaven;
        method = '比用';
        break;
      }
    }
  }
  // 3. fallback: 取 1 课天上神
  if (!chu) {
    chu = fc.ke1.heaven;
    method = 'fallback';
    warnings.push({
      code: 'liuren.threeTrans.fallback',
      message: '四课无显著克贼，回退取 1 课上神为初传；高级九宗门 (涉害/昴星/别责/八专/伏吟/反吟) 未实现。',
      level: 'warn',
    });
  }
  const zhong = heavenOfEarth(plates, chu);
  const mo = heavenOfEarth(plates, zhong);

  trace.push({
    rule: 'liuren.threeTransmissions',
    detail: `三传：方法=${method}；初传=${chu}，中传=${zhong}，末传=${mo}。`,
    data: { method, chu, zhong, mo },
  });

  return { chu, zhong, mo, method };
}

/**
 * 十二天将排布：
 *   贵人 起于地盘上 nobleEarth 位 (昼/夜贵)。
 *   贵人在地盘亥子丑寅卯辰 (北→东) → 顺布。
 *   贵人在地盘巳午未申酉戌 (南→西) → 逆布。
 *   顺序：贵人,腾蛇,朱雀,六合,勾陈,青龙,天空,白虎,太常,玄武,太阴,天后 (12 位).
 */
export function placeTwelveDeities(
  plates: PlateCell[],
  dayStem: StemCN,
  isNight: boolean,
  trace: ExplanationStep[],
): { plates: PlateCell[]; nobleEarth: BranchCN } {
  const nobleEarth = (isNight ? NOBLE_PERSON_NIGHT : NOBLE_PERSON_DAY)[dayStem];
  const startEarthIdx = branchIdx(nobleEarth);

  // 贵人顺逆 by 地盘宫位 (亥子丑寅卯辰=11,0,1,2,3,4 → 顺；巳午未申酉戌=5..10 → 逆)
  const forwardSet = new Set<BranchCN>(['亥','子','丑','寅','卯','辰']);
  const direction: 1 | -1 = forwardSet.has(nobleEarth) ? 1 : -1;

  const out = plates.map((p) => ({ ...p }));
  for (let i = 0; i < 12; i++) {
    const eIdx = ((startEarthIdx + direction * i) % 12 + 12) % 12;
    out[eIdx].deity = DEITY_ORDER[i] as TwelveDeity;
  }
  trace.push({
    rule: 'liuren.deities',
    detail: `${isNight ? '夜' : '昼'}贵人=${nobleEarth} (${dayStem})；${direction === 1 ? '顺布' : '逆布'} 12 天将。`,
    data: {
      nobleEarth, isNight, direction,
      mapping: out.map((c) => `地盘${c.earthBranch}=${c.deity}`),
    },
  });
  return { plates: out, nobleEarth };
}

export { STEM_ELEMENT, BRANCH_ELEMENT };
