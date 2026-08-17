/** Public-output safety policy for historical Tieban clause text. */

const HIGH_RISK_PERSONAL_OUTCOME_PATTERNS: RegExp[] = [
  /寿元|寿命|寿数|寿限|终寿|寿终/,
  /死期|死亡|死因|猝死|短命|夭折|夭亡|亡故|殁|仙逝/,
  /(?:归期|大数已尽|往西行).{0,8}(?:岁|旬|寿|终|尽)?/,
];

export const PUBLIC_CLAUSE_REDACTION = '该条文包含不适合公开呈现的高风险个人结论，已按商业安全政策屏蔽。';

export interface PublicClauseContent {
  content: string;
  excluded: boolean;
}

export function containsHighRiskPersonalOutcome(content: unknown): boolean {
  if (content == null) return false;
  const text = String(content);
  return HIGH_RISK_PERSONAL_OUTCOME_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizePublicClauseContent(content: unknown): PublicClauseContent {
  if (content == null) return { content: '', excluded: false };
  const text = String(content);
  if (!containsHighRiskPersonalOutcome(text)) return { content: text, excluded: false };
  return { content: PUBLIC_CLAUSE_REDACTION, excluded: true };
}
