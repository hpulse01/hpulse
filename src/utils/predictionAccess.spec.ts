import { describe, expect, it } from 'vitest';
import { assertSuperAdminAccess, isSuperAdminProfile } from './predictionAccess';

describe('predictionAccess', () => {
  it('recognizes level_4 as super admin', () => {
    expect(isSuperAdminProfile({ level: 'level_4' } as never)).toBe(true);
    expect(isSuperAdminProfile({ level: 'level_3' } as never)).toBe(false);
  });

  it('blocks non-super-admin access to orchestration payloads', () => {
    expect(() => assertSuperAdminAccess({ level: 'level_2' } as never)).toThrow(/Super admin/);
    expect(() => assertSuperAdminAccess({ level: 'level_4' } as never)).not.toThrow();
  });
});
