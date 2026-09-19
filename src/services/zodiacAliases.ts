/**
 * Classical texts use "犬" for Dog while the modern UI uses "狗".
 * Map modern names to any classical aliases the corpus may use.
 */
export const ZODIAC_CLASSICAL_ALIASES: Record<string, string[]> = {
  '狗': ['犬'],
};

export function getZodiacVariants(zodiac: string): string[] {
  return [zodiac, ...(ZODIAC_CLASSICAL_ALIASES[zodiac] ?? [])];
}
