const candidate = String(import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? '').trim();

/** Public support identity must be separate from every privileged login. */
export const PUBLIC_SUPPORT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)
  ? candidate
  : '';

export function publicSupportMailto(subject?: string): string | null {
  if (!PUBLIC_SUPPORT_EMAIL) return null;
  return `mailto:${PUBLIC_SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
