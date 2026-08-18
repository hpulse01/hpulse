import { describe, expect, it } from 'vitest';
import {
  containsHighRiskPersonalOutcome,
  PUBLIC_CLAUSE_REDACTION,
  sanitizePublicClauseContent,
} from '../sensitiveContent';

describe('Tieban public clause safety', () => {
  it.each([
    '寿元七旬，大数已尽。',
    '若问寿命何日止，六旬有九是归期。',
    '其人终寿之数另有定论。',
    '此处直述死亡年龄。',
  ])('redacts high-risk individualized outcome text: %s', (content) => {
    expect(containsHighRiskPersonalOutcome(content)).toBe(true);
    expect(sanitizePublicClauseContent(content)).toEqual({
      content: PUBLIC_CLAUSE_REDACTION,
      excluded: true,
    });
  });

  it('preserves ordinary cultural clause text', () => {
    const content = '勤勉守成，宜重视长期规划。';
    expect(sanitizePublicClauseContent(content)).toEqual({ content, excluded: false });
  });
});
