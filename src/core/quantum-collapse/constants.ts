/**
 * Quantum Collapse — Constants
 *
 * Deterministic tuning parameters. Adjust here, never inline.
 */

import type { CanonicalCategory, SensitiveFlag } from './types';

export const ALGORITHM_VERSION = 'qc-1.0.0-p6';

/** Default pruning threshold: branches below this cumulative probability dropped */
export const DEFAULT_PRUNING_THRESHOLD = 0.015;
export const DEFAULT_MIN_EVENT_PROBABILITY = 0.05;
export const DEFAULT_MAX_BRANCH_PER_NODE = 4;
export const DEFAULT_MAX_DEPTH = 14;
export const DEFAULT_TERMINAL_AGE_MAX = 110;
export const DEFAULT_MAX_TOTAL_NODES = 240;

/** Source-grade confidence multiplier */
export const SOURCE_GRADE_WEIGHT: Record<string, number> = {
  A: 1.0, B: 0.85, C: 0.65, D: 0.45,
};

/** Implementation-status confidence multiplier */
export const IMPLEMENTATION_STATUS_WEIGHT: Record<string, number> = {
  complete: 1.0,
  partial: 0.6,
  needs_source_validation: 0.4,
  placeholder_removed: 0.3,
  unknown: 0.5,
};

/** Default time-window precision multiplier */
export const PRECISION_WEIGHT: Record<string, number> = {
  exact: 1.0, narrow: 0.85, wide: 0.6, unknown: 0.4,
};

/** Sensitive categories — never deleted, always flagged */
export const SENSITIVE_CATEGORIES: CanonicalCategory[] = [
  'death', 'illness', 'accident', 'legal', 'conflict',
];

export const SENSITIVE_KEYWORDS: Record<SensitiveFlag, string[]> = {
  death: ['死', '亡', '寿', '终', '离世', '殁', 'death', 'die', 'fatal', 'mortal', 'demise', 'lifespan', 'terminal'],
  illness: ['病', '疾', '癌', '伤', '医', '住院', 'illness', 'disease', 'cancer', 'sick', 'hospital'],
  accident: ['灾', '祸', '车祸', '意外', 'accident', 'crash', 'injury', 'disaster'],
  crime: ['牢', '狱', '罪', '盗', '抢', 'crime', 'jail', 'prison', 'theft', 'robbery'],
  violence: ['打', '斗', '杀', '暴', 'violence', 'fight', 'assault'],
  self_harm: ['自杀', '自残', '自伤', 'self-harm', 'suicide'],
  relationship_breakdown: ['离', '分', '破', '散', 'divorce', 'separation', 'breakup'],
  financial_loss: ['破财', '损财', '亏', '赔', '失财', 'bankruptcy', 'loss', 'debt'],
  legal_dispute: ['诉', '讼', '官司', 'lawsuit', 'litigation'],
  family_loss: ['丧', '丧亲', '父母去', 'bereavement', 'mourning'],
};

/** Category keyword map → canonical category (zh + en) */
export const CATEGORY_KEYWORDS: Record<CanonicalCategory, string[]> = {
  career: ['事业', '工作', '官', '职', '升迁', '升职', 'career', 'job', 'work', 'promotion', 'employment'],
  wealth: ['财', '富', '钱', '收入', '投资', 'wealth', 'money', 'finance', 'income', 'investment'],
  relationship: ['人际', '朋友', '社交', 'relation', 'friend', 'social'],
  marriage: ['婚', '配偶', '夫', '妻', 'marriage', 'spouse', 'wedding'],
  family: ['家', '家庭', '亲人', 'family', 'household'],
  children: ['子', '女', '儿', '孩', 'child', 'children', 'son', 'daughter'],
  parents: ['父', '母', '双亲', 'parent', 'father', 'mother'],
  health: ['健康', '体', '康', 'health', 'wellness', 'fitness'],
  illness: ['病', '疾', '癌', 'illness', 'disease', 'cancer'],
  accident: ['灾', '祸', '意外', 'accident', 'disaster'],
  death: ['死', '亡', '寿', 'death', 'lifespan'],
  migration: ['迁', '移', '搬', '出国', 'migration', 'relocation', 'move'],
  education: ['学', '考', '试', '教育', 'education', 'study', 'exam', 'school'],
  creativity: ['创', '艺', '作', '创造', 'creative', 'art', 'creation'],
  reputation: ['名', '誉', '声', '名望', 'reputation', 'fame', 'honor'],
  legal: ['诉', '法', '律', '官司', 'legal', 'law', 'court'],
  conflict: ['争', '斗', '冲突', 'conflict', 'dispute'],
  spiritual: ['修', '悟', '灵', '禅', 'spiritual', 'meditation', 'enlightenment'],
  property: ['宅', '房', '产', 'property', 'house', 'estate'],
  turning_point: ['转', '变', '关键', 'turning', 'pivot', 'milestone'],
  unknown: [],
};

export const SEVERITY_LEVELS: Record<string, number> = {
  minor: 1, moderate: 2, major: 3, critical: 4, life_defining: 5,
};

/** Categories that map by default to a polarity (used when context says nothing) */
export const DEFAULT_POLARITY: Record<CanonicalCategory, 'positive' | 'negative' | 'neutral' | 'mixed'> = {
  career: 'mixed', wealth: 'mixed', relationship: 'mixed', marriage: 'mixed',
  family: 'neutral', children: 'neutral', parents: 'neutral',
  health: 'neutral', illness: 'negative', accident: 'negative', death: 'negative',
  migration: 'mixed', education: 'positive', creativity: 'positive',
  reputation: 'mixed', legal: 'negative', conflict: 'negative',
  spiritual: 'positive', property: 'mixed', turning_point: 'mixed', unknown: 'neutral',
};
