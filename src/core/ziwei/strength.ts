/**
 * P4.4 — 命宫综合强弱分析.
 */

import type { ExplanationStep } from '../astro-time/types';
import type { ZiweiPalace, ZiweiPattern, ZiweiStrengthAnalysis, WuxingJu } from './types';

const SHENG: Record<string, string> = { '水': '金', '木': '水', '火': '木', '土': '火', '金': '土' };

export function analyzeZiweiStrength(
  palaces: ZiweiPalace[],
  patterns: ZiweiPattern[],
  wuxingJu: WuxingJu,
): ZiweiStrengthAnalysis {
  const trace: ExplanationStep[] = [];
  const palaceScores: Record<string, number> = {};
  for (const p of palaces) palaceScores[p.name] = p.strengthScore;

  const ming = palaces.find(p => p.isMing);
  const baseMing = palaceScores['命宫'] ?? 50;
  const patternBonus = patterns.reduce((s, p) => s + p.impact, 0);
  const finalScore = Math.max(5, Math.min(95, baseMing + patternBonus));

  let grade: ZiweiStrengthAnalysis['grade'];
  if (finalScore >= 85) grade = '上上';
  else if (finalScore >= 75) grade = '上';
  else if (finalScore >= 65) grade = '中上';
  else if (finalScore >= 50) grade = '中';
  else if (finalScore >= 40) grade = '中下';
  else if (finalScore >= 25) grade = '下';
  else grade = '下下';

  const findings: string[] = [];
  if (ming) {
    const majors = ming.stars.filter(s => s.type === 'major');
    if (majors.length > 0) {
      findings.push(`命宫主星: ${majors.map(s => `${s.name}(${s.brightness})`).join('、')}`);
    } else {
      findings.push('命宫无主星，需借对宫星曜论吉凶');
    }
  }
  for (const p of patterns.filter(p => Math.abs(p.impact) >= 5)) {
    findings.push(`${p.name}: ${p.description}`);
  }

  const riskFactors = patterns.filter(p => p.impact <= -5).map(p => p.name);
  const opportunityFactors = patterns.filter(p => p.impact >= 5).map(p => p.name);

  const favorableElements: string[] = [wuxingJu.element];
  if (SHENG[wuxingJu.element]) favorableElements.push(SHENG[wuxingJu.element]);

  trace.push({
    rule: 'ziwei.strength.score',
    detail: `命宫基础分=${baseMing}, 格局加成=${patternBonus}, 最终=${finalScore} (${grade})`,
    data: { baseMing, patternBonus, finalScore, grade },
  });

  return {
    mingScore: finalScore,
    grade,
    findings,
    favorableElements,
    palaceScores,
    riskFactors,
    opportunityFactors,
    explanationTrace: trace,
  };
}
