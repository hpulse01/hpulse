/**
 * P4.3 — 六亲校时 (family-fact verification → time lock → systemOffset).
 *
 * User-provided family facts are the SOURCE OF TRUTH and override any purely
 * mathematical prediction. This module:
 *   1. Computes a per-quarter score against user facts (transparent breakdown).
 *   2. Locks onto the highest-scoring quarter as the "correct" 刻.
 *   3. Derives `systemOffset = lockedClause − expectedClause(theoreticalBase)`.
 *   4. Records every step in `explanationTrace`.
 */

import type { AstroWarning, ExplanationStep } from '../astro-time/types';
import { TiebanEngine } from '../../utils/tiebanAlgorithm';
import type {
  FamilyFacts,
  FamilyVerificationCandidate,
  FamilyVerificationResult,
  QuarterKeResult,
  TheoreticalBaseResult,
} from './types';

const ZODIAC_CN = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

function circularDiff(a: number, b: number, mod = 12): number {
  const d = Math.abs(a - b) % mod;
  return Math.min(d, mod - d);
}

export function familyVerification(
  legacyBaseNumber: number,
  base: TheoreticalBaseResult,
  quarter: QuarterKeResult,
  facts: FamilyFacts,
): FamilyVerificationResult {
  // Use the legacy SixRelations matcher for predicted father/mother zodiacs;
  // we will RECOMPUTE the score with a transparent breakdown so users can
  // see exactly why a quarter won.
  const legacyRanked = TiebanEngine.calculateSixRelationsMatch(legacyBaseNumber, facts);
  const legacyByQuarter = new Map(legacyRanked.map((r) => [r.quarterIndex, r]));

  const ranked: FamilyVerificationCandidate[] = quarter.candidates.map((c) => {
    const legacy = legacyByQuarter.get(c.quarterIndex)!;
    const predFather = legacy.predictedFatherZodiac;
    const predMother = legacy.predictedMotherZodiac;

    let father = 0;
    if (predFather === facts.fatherZodiac) father = 35;
    else {
      const d = circularDiff(predFather, facts.fatherZodiac);
      if (d === 1) father = 15;
      else if (d === 2) father = 5;
    }

    let mother = 0;
    if (predMother === facts.motherZodiac) mother = 35;
    else {
      const d = circularDiff(predMother, facts.motherZodiac);
      if (d === 1) mother = 15;
      else if (d === 2) mother = 5;
    }

    const seed = legacyBaseNumber + c.keOffset;
    const seedDigitSum = String(seed).split('').reduce((a, b) => a + parseInt(b || '0', 10), 0);
    const statusIndicator = seedDigitSum % 4;
    const statusMatch =
      (facts.parentsStatus === 'both_alive' && statusIndicator === 0) ||
      (facts.parentsStatus === 'father_deceased' && statusIndicator === 1) ||
      (facts.parentsStatus === 'mother_deceased' && statusIndicator === 2) ||
      (facts.parentsStatus === 'both_deceased' && statusIndicator === 3);
    const parentsStatus = statusMatch ? 20 : 0;

    const siblingPredict = (seed % 8) + 1;
    let siblings = 0;
    if (siblingPredict === facts.siblingsCount) siblings = 10;
    else if (Math.abs(siblingPredict - facts.siblingsCount) === 1) siblings = 5;

    // Optional 妻/夫宫 bonus dimension (spouse offset 6, mirroring father=3 / mother=9).
    let spouse: number | undefined;
    if (facts.spouseZodiac != null) {
      const predSpouse = Math.abs(seed + 6) % 12;
      if (predSpouse === facts.spouseZodiac) spouse = 15;
      else {
        const d = circularDiff(predSpouse, facts.spouseZodiac);
        spouse = d === 1 ? 6 : d === 2 ? 2 : 0;
      }
    }

    const matchScore = Math.min(100, father + mother + parentsStatus + siblings + (spouse ?? 0));

    return {
      ...c,
      predictedFatherZodiac: predFather,
      predictedMotherZodiac: predMother,
      matchScore,
      scoreBreakdown: { father, mother, parentsStatus, siblings, ...(spouse != null ? { spouse } : {}) },
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const locked = ranked[0];
  const systemOffset = TiebanEngine.calculateSystemOffset(base.theoreticalBase, locked.clauseNumber);

  const warnings: AstroWarning[] = [];
  if (locked.matchScore === 0) {
    warnings.push({
      code: 'KAOKE_NO_MATCH',
      message: '六亲校时分数为 0：用户输入与所有 8 刻预测都不吻合，请人工复核家庭事实输入。',
      severity: 'error',
    });
  } else if (ranked.length > 1 && locked.matchScore - ranked[1].matchScore < 5) {
    warnings.push({
      code: 'KAOKE_TIE_RISK',
      message: `Top-1 与 Top-2 分差 ${locked.matchScore - ranked[1].matchScore}，时间锁定置信度低，建议补充输入。`,
      severity: 'warning',
    });
  }

  const trace: ExplanationStep[] = [
    {
      rule: 'tieban.kaoke.facts',
      detail: '用户输入家庭事实（六亲）= 校时唯一真实标准，覆盖纯数学预测。',
      data: {
        father: ZODIAC_CN[facts.fatherZodiac],
        mother: ZODIAC_CN[facts.motherZodiac],
        parentsStatus: facts.parentsStatus,
        siblings: facts.siblingsCount,
      },
    },
    {
      rule: 'tieban.kaoke.scoring',
      detail: '每刻分数 = 父35 + 母35 + 父母状态20 + 兄弟数10（+ 可选妻/夫宫加分≤15）；近1属相+15，近2属相+5。',
      data: {
        ranked: ranked.map((c) => ({
          quarter: c.label,
          clause: c.clauseNumber,
          score: c.matchScore,
          breakdown: c.scoreBreakdown,
          predictedFather: ZODIAC_CN[c.predictedFatherZodiac],
          predictedMother: ZODIAC_CN[c.predictedMotherZodiac],
        })),
      },
    },
    {
      rule: 'tieban.kaoke.lock',
      detail: `锁定 ${locked.label} (clause ${locked.clauseNumber}, score ${locked.matchScore}/100)`,
      data: {
        lockedQuarter: locked.quarterIndex,
        lockedClause: locked.clauseNumber,
        lockedScore: locked.matchScore,
      },
    },
    {
      rule: 'tieban.kaoke.systemOffset',
      detail: 'systemOffset = lockedClause − expectedClause(theoreticalBase + PARENTS palace)',
      data: { theoreticalBase: base.theoreticalBase, lockedClause: locked.clauseNumber, systemOffset },
    },
  ];

  return { ranked, locked, systemOffset, explanationTrace: trace, warnings };
}
