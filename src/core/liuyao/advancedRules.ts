/**
 * P5 — 六爻进阶规则：伏神/飞神、进退神、伏吟/反吟、应期。
 * 全部确定性查表推导，无随机、无系统时间。
 */

import type {
  FiveElement, FuShenInfo, Hexagram, HexagramLine, JinTuiEntry, FanFuYinInfo,
  SixRelative, YingQiCandidate, YongShenAnalysis, CalendarContext,
} from './types';
import { applyNajia } from './najia';
import { assignRelatives } from './sixRelatives';
import { BRANCH_CHONG, BRANCH_HE, WUXING_SHENG, WUXING_KE, BRANCH_ELEMENTS } from './constants';
import { EIGHT_PALACES } from './hexagramTables';

// ─── 伏神 / 飞神 ──────────────────────────────────────────────────────────

/**
 * 用神不现时，从本宫八纯卦（首卦）中寻伏神：
 * 首卦该六亲所在爻的地支即伏神，伏于本卦同位爻（飞神）之下。
 */
export function findFuShen(main: Hexagram, yongShen: SixRelative): FuShenInfo | null {
  const palaceIdx = EIGHT_PALACES.findIndex((p) => p.name === main.palace);
  if (palaceIdx < 0) return null;
  const pure = EIGHT_PALACES[palaceIdx];
  const pureNajia = applyNajia(pure.name, pure.name);
  const pureRelatives = assignRelatives(pure.element, pureNajia.map((n) => n.branch));
  const idx = pureRelatives.findIndex((r) => r === yongShen);
  if (idx < 0) return null;

  const fuBranch = pureNajia[idx].branch;
  const fuElement = pureNajia[idx].element;
  const flying: HexagramLine = main.lines[idx];

  let relation: FuShenInfo['relation'];
  let judgment: string;
  if (WUXING_SHENG[flying.element] === fuElement) {
    relation = '飞来生伏';
    judgment = `飞神 ${flying.branch}(${flying.element}) 生伏神 ${fuBranch}(${fuElement})，伏神得生有用，待引拔而出。`;
  } else if (WUXING_SHENG[fuElement] === flying.element) {
    relation = '伏去生飞';
    judgment = `伏神 ${fuBranch}(${fuElement}) 生飞神 ${flying.branch}(${flying.element})，泄气之伏，事多耗力。`;
  } else if (WUXING_KE[flying.element] === fuElement) {
    relation = '飞来克伏';
    judgment = `飞神 ${flying.branch}(${flying.element}) 克伏神 ${fuBranch}(${fuElement})，伏神受制难出，事多阻滞。`;
  } else if (WUXING_KE[fuElement] === flying.element) {
    relation = '伏去克飞';
    judgment = `伏神 ${fuBranch}(${fuElement}) 克飞神 ${flying.branch}(${flying.element})，伏神出暴，冲开飞神之日可成。`;
  } else {
    relation = '比和';
    judgment = `伏神 ${fuBranch} 与飞神 ${flying.branch} 比和，伏神可借旬日透出。`;
  }

  return {
    yongShen,
    position: idx + 1,
    branch: fuBranch,
    element: fuElement,
    flyingBranch: flying.branch,
    flyingElement: flying.element,
    relation,
    judgment,
  };
}

// ─── 进神 / 退神 ──────────────────────────────────────────────────────────

/** 经典进神对：化出之支较原支为「进」。反向即退神。 */
const JIN_PAIRS: Record<string, string> = {
  '寅': '卯', '巳': '午', '申': '酉', '亥': '子',
  '丑': '辰', '辰': '未', '未': '戌', '戌': '丑',
};

export function detectJinTuiShen(main: Hexagram): JinTuiEntry[] {
  const out: JinTuiEntry[] = [];
  for (const ln of main.lines) {
    if (!ln.isChanging || !ln.changedBranch) continue;
    if (JIN_PAIRS[ln.branch] === ln.changedBranch) {
      out.push({
        position: ln.position, type: '进神',
        from: ln.branch, to: ln.changedBranch,
        description: `第${ln.position}爻 ${ln.branch}化${ln.changedBranch}为进神，事势渐进增旺。`,
      });
    } else if (JIN_PAIRS[ln.changedBranch] === ln.branch) {
      out.push({
        position: ln.position, type: '退神',
        from: ln.branch, to: ln.changedBranch,
        description: `第${ln.position}爻 ${ln.branch}化${ln.changedBranch}为退神，事势渐退消减。`,
      });
    }
  }
  return out;
}

// ─── 伏吟 / 反吟 ──────────────────────────────────────────────────────────

export function detectFanFuYin(main: Hexagram): FanFuYinInfo {
  const fuYinPositions: number[] = [];
  const fanYinPositions: number[] = [];
  for (const ln of main.lines) {
    if (!ln.isChanging || !ln.changedBranch) continue;
    if (ln.changedBranch === ln.branch) fuYinPositions.push(ln.position);
    else if (BRANCH_CHONG[ln.branch] === ln.changedBranch) fanYinPositions.push(ln.position);
  }
  // 评分调整：伏吟主呻吟迟滞，反吟主反复颠倒。
  const scoreAdjustment = fuYinPositions.length * -5 + fanYinPositions.length * -8;
  const notes: string[] = [];
  if (fuYinPositions.length > 0) notes.push(`第${fuYinPositions.join('、')}爻伏吟，事体迟滞呻吟，难以速成。`);
  if (fanYinPositions.length > 0) notes.push(`第${fanYinPositions.join('、')}爻反吟，事多反复颠倒，得失无常。`);
  return { fuYinPositions, fanYinPositions, scoreAdjustment, notes };
}

// ─── 应期 ─────────────────────────────────────────────────────────────────

/**
 * 应期细化：依用神状态推断应验时间候选（值/合/冲/出空/绝处逢生）。
 * 输出为地支日候选 + 推理依据。
 */
export function deriveYingQi(
  main: Hexagram,
  yongShen: YongShenAnalysis,
  calendar: CalendarContext | null,
): YingQiCandidate[] {
  const out: YingQiCandidate[] = [];
  if (yongShen.positions.length === 0) {
    // 用神不现 → 伏神出透之期：本宫首卦伏神之支值日或冲飞神之日。
    const fu = findFuShen(main, yongShen.yongShen);
    if (fu) {
      out.push({ branch: fu.branch, basis: '伏神值日', description: `伏神 ${fu.branch} 值日之时透出，为应期候选。` });
      out.push({ branch: BRANCH_CHONG[fu.flyingBranch], basis: '冲飞神', description: `冲开飞神 ${fu.flyingBranch} 之 ${BRANCH_CHONG[fu.flyingBranch]} 日，伏神得出。` });
    }
    return out;
  }

  const yongLine = main.lines[yongShen.positions[0] - 1];
  const b = yongLine.branch;
  if (yongLine.isVoid) {
    out.push({ branch: b, basis: '出空填实', description: `用神 ${b} 旬空，出空值日（${b}日）填实为应期。` });
    out.push({ branch: BRANCH_CHONG[b], basis: '冲空', description: `${BRANCH_CHONG[b]}日冲空亦可为应期。` });
  } else if (yongLine.isChanging) {
    out.push({ branch: b, basis: '动爻值日', description: `用神发动，${b}值日为应期。` });
    out.push({ branch: BRANCH_HE[b], basis: '合住之期', description: `动而逢合，${BRANCH_HE[b]}日合住用神为应期。` });
  } else {
    out.push({ branch: b, basis: '静爻值日', description: `用神安静，${b}值日为应期候选。` });
    out.push({ branch: BRANCH_CHONG[b], basis: '冲动之期', description: `静而待冲，${BRANCH_CHONG[b]}日冲动用神为应期。` });
  }

  if (calendar && BRANCH_ELEMENTS[calendar.dayBranch] && WUXING_KE[BRANCH_ELEMENTS[calendar.dayBranch]] === yongLine.element) {
    out.push({
      branch: BRANCH_CHONG[calendar.dayBranch], basis: '克解之期',
      description: `日辰 ${calendar.dayBranch} 克用神，${BRANCH_CHONG[calendar.dayBranch]}日冲去克神后可应。`,
    });
  }
  return out;
}

/** 五行序号便捷（导出供测试用）。 */
export function elementOfBranch(branch: string): FiveElement {
  return BRANCH_ELEMENTS[branch];
}
