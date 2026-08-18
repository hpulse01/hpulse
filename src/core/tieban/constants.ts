/**
 * P4.3 — Tieban (铁板神数) constants.
 *
 * Pure, deterministic. No randomness, no clock reads.
 * Palace offsets are mirrored from src/utils/tiebanAlgorithm.ts so the new core
 * stays consistent with legacy projections used by the existing UI.
 */

export const BASE_MODULO = 12000;
export const MIN_CLAUSE_ID = 1;
export const MAX_CLAUSE_ID = 12000;
export const PALACE_SPAN = 1000;

export const PALACE_OFFSETS = {
  KAO_KE: 0,
  PARENTS: 0,
  FATE: 1000,
  SIBLINGS: 2000,
  MARRIAGE: 3000,
  CHILDREN: 4000,
  WEALTH: 5000,
  CAREER: 6000,
  HEALTH: 7000,
  PROPERTY: 8000,
  FLOW_YEAR: 9000,
  FLOW_MONTH: 10000,
} as const;

export type PalaceKey = keyof typeof PALACE_OFFSETS;

/** Sections produced by `generateTiebanReport`. Keep additive — never delete. */
export interface SectionSpec {
  key: string;
  nameCN: string;
  palace: PalaceKey;
  /** Sensitive sections must use neutral/cautious language and emit sensitiveFlags. */
  sensitive?: boolean;
  /** Sensitive risk category for downstream UI gating. */
  sensitiveCategory?: 'health' | 'disaster' | 'relationship';
}

export const SECTION_SPECS: SectionSpec[] = [
  { key: 'overview',  nameCN: '命运总论',  palace: 'FATE' },
  { key: 'marriage',  nameCN: '婚姻姻缘',  palace: 'MARRIAGE', sensitive: true, sensitiveCategory: 'relationship' },
  { key: 'wealth',    nameCN: '财运财富',  palace: 'WEALTH' },
  { key: 'career',    nameCN: '事业前程',  palace: 'CAREER' },
  { key: 'health',    nameCN: '健康趋势',  palace: 'HEALTH', sensitive: true, sensitiveCategory: 'health' },
  { key: 'children',  nameCN: '子嗣后代',  palace: 'CHILDREN' },
  { key: 'parents',   nameCN: '父母六亲',  palace: 'PARENTS' },
  { key: 'siblings',  nameCN: '兄弟姐妹',  palace: 'SIBLINGS' },
  { key: 'migration', nameCN: '迁移远行',  palace: 'PROPERTY' },
  { key: 'disaster',  nameCN: '灾厄风险',  palace: 'HEALTH', sensitive: true, sensitiveCategory: 'disaster' },
];

/** Keyword lists used to surface sensitiveFlags from clause text. */
export const SENSITIVE_KEYWORDS: Record<NonNullable<SectionSpec['sensitiveCategory']>, string[]> = {
  health:       ['病', '疾', '疮', '伤', '残', '弱'],
  disaster:     ['灾', '厄', '凶', '险', '祸', '刑', '难'],
  relationship: ['离', '克', '寡', '孤', '别', '婚变'],
};
