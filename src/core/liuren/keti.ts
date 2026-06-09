/**
 * P4.8+ — 大六壬九宗门课体识别（完整三传发用）。
 *
 * 顺序：伏吟 → 反吟 → 贼克（重审/元首）→ 比用（知一）→ 涉害 →
 *       遥克（蒿矢/弹射）→ 昴星（虎视/冬蛇掩目）→ 别责 → 八专 → fallback。
 *
 * 全部确定性表查找/规则推导，无随机、无系统时间。
 */
import type {
  BranchCN, StemCN, PlateCell, FourClasses, ThreeTransmissions,
  ExplanationStep, LiurenWarning,
} from './types';
import {
  BRANCHES, STEMS, DAY_STEM_PALACE,
  STEM_ELEMENT, BRANCH_ELEMENT, ELEMENT_OVERCOMES,
} from './constants';
import { heavenOfEarth } from './plate';

const bIdx = (b: BranchCN) => BRANCHES.indexOf(b);
const isYangStem = (s: StemCN) => STEMS.indexOf(s) % 2 === 0;
const isYangBranch = (b: BranchCN) => bIdx(b) % 2 === 0;
const elemOvercomes = (a: '金'|'木'|'水'|'火'|'土', b: '金'|'木'|'水'|'火'|'土') => ELEMENT_OVERCOMES[a] === b;
const branchOvercomes = (a: BranchCN, b: BranchCN) => elemOvercomes(BRANCH_ELEMENT[a], BRANCH_ELEMENT[b]);

/** 六冲。 */
const oppositeBranch = (b: BranchCN): BranchCN => BRANCHES[(bIdx(b) + 6) % 12];

/** 五合：甲己 乙庚 丙辛 丁壬 戊癸。 */
const STEM_HE: Record<StemCN, StemCN> = {
  '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊',
};

/** 三合局（取支前合：申子辰 寅午戌 巳酉丑 亥卯未，取顺序中下一位）。 */
const SAN_HE_NEXT: Record<BranchCN, BranchCN> = {
  '申': '子', '子': '辰', '辰': '申',
  '寅': '午', '午': '戌', '戌': '寅',
  '巳': '酉', '酉': '丑', '丑': '巳',
  '亥': '卯', '卯': '未', '未': '亥',
};

/** 八专日：干支同位（干寄宫与支同遁），即 甲寅、庚申、丁未、己未、戊戌、癸丑 等干寄宫=支之日。 */
function isBaZhuanDay(dayStem: StemCN, dayBranch: BranchCN): boolean {
  return DAY_STEM_PALACE[dayStem] === dayBranch;
}

interface Course { earth: BranchCN; heaven: BranchCN }

interface Derived {
  chu: BranchCN; zhong: BranchCN; mo: BranchCN;
  method: ThreeTransmissions['method'];
  keTi: string;
  detail: string;
}

/** 涉害深度：天盘神自其地盘所临之位顺行至本家宫，途中所克地盘支个数。 */
function shePoHaiDepth(course: Course): number {
  const start = bIdx(course.earth);
  const home = bIdx(course.heaven);
  let depth = 0;
  let i = start;
  for (let step = 0; step < 12; step++) {
    const passed = BRANCHES[i];
    if (branchOvercomes(course.heaven, passed)) depth++;
    if (i === home) break;
    i = (i + 1) % 12;
  }
  return depth;
}

const MENG_BRANCHES: BranchCN[] = ['寅', '申', '巳', '亥']; // 四孟
const ZHONG_BRANCHES: BranchCN[] = ['子', '午', '卯', '酉']; // 四仲

/**
 * 完整九宗门三传发用。
 */
export function deriveThreeTransmissionsFull(
  plates: PlateCell[],
  fc: FourClasses,
  dayStem: StemCN,
  dayBranch: BranchCN,
  trace: ExplanationStep[],
  warnings: LiurenWarning[],
): ThreeTransmissions & { keTi: string } {
  const courses: Course[] = [fc.ke1, fc.ke2, fc.ke3, fc.ke4];
  const ganJi = DAY_STEM_PALACE[dayStem];
  const ganShang = fc.ke1.heaven; // 干上神
  const zhiShang = fc.ke3.heaven; // 支上神
  const stemElem = STEM_ELEMENT[dayStem];

  const chain = (chu: BranchCN): { zhong: BranchCN; mo: BranchCN } => {
    const zhong = heavenOfEarth(plates, chu);
    const mo = heavenOfEarth(plates, zhong);
    return { zhong, mo };
  };

  const finish = (d: Derived): ThreeTransmissions & { keTi: string } => {
    trace.push({
      rule: 'liuren.keTi',
      detail: `课体=${d.keTi}（${d.method}）：${d.detail} 三传：初=${d.chu} 中=${d.zhong} 末=${d.mo}。`,
      data: { method: d.method, keTi: d.keTi, chu: d.chu, zhong: d.zhong, mo: d.mo },
    });
    return { chu: d.chu, zhong: d.zhong, mo: d.mo, method: d.method, keTi: d.keTi };
  };

  // ── 1. 伏吟（天盘=地盘） ──
  const isFuYin = plates.every((p) => p.earthBranch === p.heavenBranch);
  if (isFuYin) {
    // 有克仍取克为用；无克：阳日取干上神，阴日取支上神；中末取刑（简化为顺三合/自刑取冲）。
    const kele = courses.find((c) => branchOvercomes(c.heaven, c.earth) || branchOvercomes(c.earth, c.heaven));
    const chu = kele ? kele.heaven : (isYangStem(dayStem) ? ganShang : zhiShang);
    const zhong = SAN_HE_NEXT[chu];
    const mo = SAN_HE_NEXT[zhong];
    return finish({
      chu, zhong, mo, method: '伏吟', keTi: '伏吟课',
      detail: `天地盘重合；${kele ? '有克取克' : isYangStem(dayStem) ? '阳日取干上神' : '阴日取支上神'}，中末递取刑合。`,
    });
  }

  // ── 2. 反吟（天盘与地盘对冲） ──
  const isFanYin = plates.every((p) => p.heavenBranch === oppositeBranch(p.earthBranch));
  if (isFanYin) {
    const kele = courses.find((c) => branchOvercomes(c.heaven, c.earth)) ??
      courses.find((c) => branchOvercomes(c.earth, c.heaven));
    if (kele) {
      const { zhong, mo } = chain(kele.heaven);
      return finish({
        chu: kele.heaven, zhong, mo, method: '反吟', keTi: '返吟课',
        detail: '天地盘对冲，有克取克为用。',
      });
    }
    // 无克：取驿马（支三合局之驿马，简化取支冲）为初，中取支上神，末取干上神。
    const chu = oppositeBranch(dayBranch);
    return finish({
      chu, zhong: zhiShang, mo: ganShang, method: '反吟', keTi: '返吟课',
      detail: '天地盘对冲且无克，取支冲为用，中支上神，末干上神。',
    });
  }

  // ── 3. 贼克（下贼上优先 → 重审；上克下 → 元首） ──
  const xiaZeiShang = courses.filter((c) => branchOvercomes(c.earth, c.heaven));
  const shangKeXia = courses.filter((c) => branchOvercomes(c.heaven, c.earth));
  const pickGroup: Course[] = xiaZeiShang.length > 0 ? xiaZeiShang : shangKeXia;
  const groupName = xiaZeiShang.length > 0 ? '重审课' : '元首课';

  if (pickGroup.length === 1) {
    const { zhong, mo } = chain(pickGroup[0].heaven);
    return finish({
      chu: pickGroup[0].heaven, zhong, mo, method: '贼克', keTi: groupName,
      detail: xiaZeiShang.length > 0 ? '一课下贼上，取被贼上神为用。' : '一课上克下，取上神为用。',
    });
  }

  if (pickGroup.length > 1) {
    // ── 4. 比用（知一）：取与日干阴阳相比者 ──
    const dayYang = isYangStem(dayStem);
    const bi = pickGroup.filter((c) => isYangBranch(c.heaven) === dayYang);
    if (bi.length === 1) {
      const { zhong, mo } = chain(bi[0].heaven);
      return finish({
        chu: bi[0].heaven, zhong, mo, method: '比用', keTi: '知一课',
        detail: `多课有克，取与日干俱${dayYang ? '阳' : '阴'}之上神为用。`,
      });
    }
    // ── 5. 涉害：取受克最深者；再以孟仲分之 ──
    const candidates = bi.length > 1 ? bi : pickGroup;
    let best: Course[] = [];
    let bestDepth = -1;
    for (const c of candidates) {
      const d = shePoHaiDepth(c);
      if (d > bestDepth) { bestDepth = d; best = [c]; }
      else if (d === bestDepth) best.push(c);
    }
    let chosen = best[0];
    if (best.length > 1) {
      chosen = best.find((c) => MENG_BRANCHES.includes(c.earth)) ??
        best.find((c) => ZHONG_BRANCHES.includes(c.earth)) ?? best[0];
    }
    const { zhong, mo } = chain(chosen.heaven);
    return finish({
      chu: chosen.heaven, zhong, mo, method: '涉害', keTi: '涉害课',
      detail: `多课俱比，历地盘涉害最深（深度=${bestDepth}），孟仲取舍。`,
    });
  }

  // ── 6. 遥克（蒿矢/弹射）：四课无克，取上神与日干遥克者 ──
  const shenKeRi = courses.filter((c) => elemOvercomes(BRANCH_ELEMENT[c.heaven], stemElem) && c.heaven !== ganShang);
  const riKeShen = courses.filter((c) => elemOvercomes(stemElem, BRANCH_ELEMENT[c.heaven]) && c.heaven !== ganShang);
  const yao = shenKeRi.length > 0 ? shenKeRi : riKeShen;
  if (yao.length > 0) {
    const dayYang = isYangStem(dayStem);
    const pick = yao.length === 1 ? yao[0] : (yao.find((c) => isYangBranch(c.heaven) === dayYang) ?? yao[0]);
    const { zhong, mo } = chain(pick.heaven);
    return finish({
      chu: pick.heaven, zhong, mo, method: '遥克',
      keTi: shenKeRi.length > 0 ? '蒿矢课' : '弹射课',
      detail: shenKeRi.length > 0 ? '上神遥克日干，取之为用（蒿矢）。' : '日干遥克上神，取之为用（弹射）。',
    });
  }

  // ── 7. 八专（干支同位） ──
  if (isBaZhuanDay(dayStem, dayBranch)) {
    let chu: BranchCN;
    if (isYangStem(dayStem)) {
      chu = BRANCHES[(bIdx(ganShang) + 2) % 12]; // 阳日：干上神顺数三位（含本位）
    } else {
      chu = BRANCHES[((bIdx(fc.ke4.heaven) - 2) % 12 + 12) % 12]; // 阴日：四课上神逆数三位
    }
    return finish({
      chu, zhong: ganShang, mo: ganShang, method: '八专', keTi: '八专课',
      detail: `干支同位（${dayStem}寄${ganJi}=支${dayBranch}），${isYangStem(dayStem) ? '阳日顺数' : '阴日逆数'}三位为用，中末用干上神。`,
    });
  }

  // ── 8. 别责（四课不全三课备，无克无遥） ──
  const uniqueCourses = new Set(courses.map((c) => `${c.earth}|${c.heaven}`));
  if (uniqueCourses.size === 3) {
    let chu: BranchCN;
    if (isYangStem(dayStem)) {
      chu = heavenOfEarth(plates, DAY_STEM_PALACE[STEM_HE[dayStem]]); // 阳日：合干寄宫上神
    } else {
      chu = SAN_HE_NEXT[dayBranch]; // 阴日：支三合前位
    }
    return finish({
      chu, zhong: ganShang, mo: ganShang, method: '别责', keTi: '别责课',
      detail: `三课备而无克无遥，${isYangStem(dayStem) ? '阳日取合干寄宫上神' : '阴日取支三合前位'}，中末用干上神。`,
    });
  }

  // ── 9. 昴星（四课全备，无克无遥） ──
  if (uniqueCourses.size === 4) {
    if (isYangStem(dayStem)) {
      const chu = heavenOfEarth(plates, '酉'); // 阳日：地盘酉上神
      return finish({
        chu, zhong: zhiShang, mo: ganShang, method: '昴星', keTi: '昴星课（虎视）',
        detail: '四课全备无克无遥，阳日取地盘酉上神为用，中支上神，末干上神。',
      });
    }
    // 阴日：天盘酉下神（天盘酉所临之地盘支）
    const cell = plates.find((p) => p.heavenBranch === '酉');
    const chu = cell ? cell.earthBranch : '酉';
    return finish({
      chu, zhong: ganShang, mo: zhiShang, method: '昴星', keTi: '昴星课（冬蛇掩目）',
      detail: '四课全备无克无遥，阴日取天盘酉下神为用，中干上神，末支上神。',
    });
  }

  // ── fallback ──
  warnings.push({
    code: 'liuren.keTi.fallback',
    message: '九宗门规则未匹配（罕见结构），回退取干上神为初传。',
    level: 'warn',
  });
  const { zhong, mo } = chain(ganShang);
  return finish({
    chu: ganShang, zhong, mo, method: 'fallback', keTi: '未识别',
    detail: '回退取干上神为用。',
  });
}
