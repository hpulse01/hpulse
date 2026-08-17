export const QUANTUM_ASPECT_LABELS = {
  career: '事业', wealth: '财富', love: '情感', health: '健康', wisdom: '智慧',
  social: '人际', creativity: '创造', fortune: '运势', family: '家庭', spirituality: '灵性',
} as const;

export const QUANTUM_EVENT_TYPE_LABELS = {
  milestone: '里程碑', opportunity: '机遇', challenge: '考验', transformation: '蜕变',
  relationship: '缘分', achievement: '成就', loss: '失去', growth: '成长', turning_point: '转折',
} as const;

export type QuantumAspectKey = keyof typeof QUANTUM_ASPECT_LABELS;
export type QuantumEventTypeKey = keyof typeof QUANTUM_EVENT_TYPE_LABELS;

export const QUANTUM_ASPECTS = Object.keys(QUANTUM_ASPECT_LABELS) as QuantumAspectKey[];

export function getQuantumAspectLabel(aspect: QuantumAspectKey): string {
  return QUANTUM_ASPECT_LABELS[aspect];
}

export function getQuantumEventTypeLabel(type: QuantumEventTypeKey): string {
  return QUANTUM_EVENT_TYPE_LABELS[type];
}
