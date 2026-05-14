/**
 * P4.6 — 体用关系（Body / Use）+ 五行生克 + 吉凶趋势.
 *
 * 规则：
 *   动爻所在卦 = 用卦；另一卦 = 体卦。
 *   - 用生体：大吉
 *   - 体克用：小吉
 *   - 比和  ：吉
 *   - 体生用：耗（mixed）
 *   - 用克体：凶
 */
import type { Hexagram, BodyUseAnalysis, FiveElement, ExplanationStep } from './types';
import { ELEMENT_GENERATES, ELEMENT_OVERCOMES } from './constants';

export function analyzeBodyUse(
  ben: Hexagram,
  movingLine: number,
  trace: ExplanationStep[],
): BodyUseAnalysis {
  // movingLine 1..3 → 下卦动 → 下卦为用，上卦为体
  // movingLine 4..6 → 上卦动 → 上卦为用，下卦为体
  const movingInLower = movingLine <= 3;
  const useTrigram = movingInLower ? ben.lower : ben.upper;
  const bodyTrigram = movingInLower ? ben.upper : ben.lower;

  const be: FiveElement = bodyTrigram.element;
  const ue: FiveElement = useTrigram.element;

  let relation: BodyUseAnalysis['relation'];
  let trend: BodyUseAnalysis['trend'];
  let trendScore: number;

  if (be === ue) {
    relation = '比和';
    trend = 'auspicious';
    trendScore = 70;
  } else if (ELEMENT_GENERATES[ue] === be) {
    relation = '用生体';
    trend = 'auspicious';
    trendScore = 85;
  } else if (ELEMENT_OVERCOMES[be] === ue) {
    relation = '体克用';
    trend = 'auspicious';
    trendScore = 65;
  } else if (ELEMENT_GENERATES[be] === ue) {
    relation = '体生用';
    trend = 'mixed';
    trendScore = 45;
  } else {
    // ELEMENT_OVERCOMES[ue] === be → 用克体
    relation = '用克体';
    trend = 'inauspicious';
    trendScore = 25;
  }

  trace.push({
    rule: 'meihua.bodyUse',
    detail: `动爻在第${movingLine}爻 → ${movingInLower ? '下卦动' : '上卦动'}；体卦=${bodyTrigram.name}(${be})，用卦=${useTrigram.name}(${ue})；关系=${relation}，趋势=${trend}（score=${trendScore}）。`,
    data: { movingLine, body: bodyTrigram.name, use: useTrigram.name, bodyElement: be, useElement: ue, relation, trend, trendScore },
  });

  return { bodyTrigram, useTrigram, bodyElement: be, useElement: ue, relation, trend, trendScore };
}
