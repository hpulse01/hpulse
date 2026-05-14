/**
 * P4.5 — 用神 (Yong Shen) selection + analysis.
 *
 * Rule (deterministic):
 *   1. If `input.yongShenCategory` is provided → use it.
 *   2. Else if `input.questionText` provided → keyword match against QUESTION_KEYWORDS,
 *      first-match wins; record the matched keyword in trace.
 *   3. Else → '综合' (defaults to 世爻's 六亲 in chart).
 *
 * 用神 strength is graded from 旺衰 + 发动 + 受克 + 空亡 — never random.
 */

import type {
  ExplanationStep, Hexagram, LiuyaoCoreInput, SixRelative, YongShenAnalysis, YongShenCategory,
} from './types';
import { QUESTION_KEYWORDS, RELATIVE_KE, RELATIVE_SHENG, YONGSHEN_RULES } from './constants';

export function selectYongShenCategory(input: LiuyaoCoreInput): {
  category: YongShenCategory;
  matchedKeyword?: string;
} {
  if (input.yongShenCategory) return { category: input.yongShenCategory };
  if (input.questionText) {
    for (const rule of QUESTION_KEYWORDS) {
      for (const kw of rule.keywords) {
        if (input.questionText.includes(kw)) return { category: rule.category, matchedKeyword: kw };
      }
    }
  }
  return { category: '综合' };
}

export function analyzeYongShen(main: Hexagram, input: LiuyaoCoreInput): YongShenAnalysis {
  const trace: ExplanationStep[] = [];
  const sel = selectYongShenCategory(input);
  trace.push({
    rule: 'liuyao.yongshen.category',
    detail: sel.matchedKeyword
      ? `根据问题文本关键字 "${sel.matchedKeyword}" 选取用神类别 = ${sel.category}`
      : input.yongShenCategory
        ? `用户显式指定 yongShenCategory = ${sel.category}`
        : `未指定问题，默认用神类别 = 综合 (取世爻六亲)`,
    data: { category: sel.category, questionText: input.questionText ?? null },
  });

  const rule = YONGSHEN_RULES[sel.category];
  let yong: SixRelative;
  if (sel.category === '综合') {
    const shi = main.lines[main.shiYao - 1];
    yong = shi?.relative ?? '兄弟';
    trace.push({
      rule: 'liuyao.yongshen.fallbackShi',
      detail: `综合测：取世爻 (第 ${main.shiYao} 爻) 六亲 = ${yong} 为用神。`,
      data: { shiYao: main.shiYao, shiRelative: yong },
    });
  } else {
    yong = rule.yongShen;
    trace.push({
      rule: 'liuyao.yongshen.tableLookup',
      detail: `按 YONGSHEN_RULES：${sel.category} → 用神 ${yong}（${rule.description}）`,
      data: { category: sel.category, yongShen: yong },
    });
  }

  const yuan = RELATIVE_SHENG[yong];
  const ji = RELATIVE_KE[yong];
  const chou = RELATIVE_SHENG[ji];

  const positions = main.lines.filter((l) => l.relative === yong).map((l) => l.position);

  // Strength
  let strength: YongShenAnalysis['strength'] = '不现';
  let judgment = '';
  if (positions.length === 0) {
    strength = '不现';
    judgment = `用神 ${yong} 不现于卦中，需查伏神或重断。`;
    trace.push({
      rule: 'liuyao.yongshen.notPresent',
      detail: judgment,
      data: { yong, presentPositions: [] },
    });
  } else {
    const yongLine = main.lines[positions[0] - 1];
    if (yongLine.isVoid) {
      strength = '空亡';
      judgment = `用神 ${yong} 居第 ${yongLine.position} 爻 ${yongLine.branch}，旬空，事多虚浮无应。`;
    } else if (yongLine.isChanging) {
      strength = '发动';
      judgment = `用神 ${yong} 发动于第 ${yongLine.position} 爻，事将有变化，须看变爻方向。`;
    } else if (yongLine.monthStrength === '旺' || yongLine.monthStrength === '相') {
      // 检查动爻中是否有忌神
      const jiHits = main.lines.filter((l) => l.isChanging && l.relative === ji);
      if (jiHits.length > 0) {
        strength = '受克';
        judgment = `用神 ${yong} 虽${yongLine.monthStrength}，但忌神 ${ji} 第 ${jiHits[0].position} 爻发动来克，事多阻。`;
      } else {
        strength = '旺相';
        judgment = `用神 ${yong} ${yongLine.monthStrength}于月令、不受克，事可成。`;
      }
    } else {
      strength = '休囚';
      judgment = `用神 ${yong} ${yongLine.monthStrength}于月令，无力，事难成或需待时。`;
    }
    trace.push({
      rule: 'liuyao.yongshen.strength',
      detail: `用神在第 ${yongLine.position} 爻 ${yongLine.branch}(${yongLine.element})，月令${yongLine.monthStrength}，${yongLine.dayRelation}，${yongLine.isVoid ? '旬空' : '不空'}，${yongLine.isChanging ? '发动' : '安静'} → 强度 = ${strength}`,
      data: {
        position: yongLine.position, branch: yongLine.branch, element: yongLine.element,
        monthStrength: yongLine.monthStrength, dayRelation: yongLine.dayRelation,
        isVoid: yongLine.isVoid, isChanging: yongLine.isChanging, strength,
      },
    });
  }

  trace.push({
    rule: 'liuyao.yongshen.judgment',
    detail: judgment,
    data: { yong, yuan, ji, chou, strength },
  });

  return {
    category: sel.category,
    yongShen: yong,
    yuanShen: yuan,
    jiShen: ji,
    chouShen: chou,
    positions,
    hidden: positions.length === 0,
    strength,
    judgment,
    trace,
  };
}
