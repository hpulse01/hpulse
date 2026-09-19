import { describe, it, expect } from 'vitest';
import { getZodiacVariants, ZODIAC_CLASSICAL_ALIASES } from '../zodiacAliases';

describe('getZodiacVariants', () => {
  it('returns the original zodiac when no alias exists', () => {
    expect(getZodiacVariants('鼠')).toEqual(['鼠']);
    expect(getZodiacVariants('牛')).toEqual(['牛']);
    expect(getZodiacVariants('虎')).toEqual(['虎']);
  });

  it('includes the classical alias "犬" for "狗" (Dog)', () => {
    const variants = getZodiacVariants('狗');
    expect(variants).toContain('狗');
    expect(variants).toContain('犬');
    expect(variants).toHaveLength(2);
  });

  it('alias map covers all known classical divergences', () => {
    expect(ZODIAC_CLASSICAL_ALIASES).toHaveProperty('狗');
    expect(ZODIAC_CLASSICAL_ALIASES['狗']).toContain('犬');
  });
});
