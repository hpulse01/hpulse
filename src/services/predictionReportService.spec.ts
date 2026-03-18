import { describe, expect, it, vi } from 'vitest';
import { getAdminOrchestrationSnapshot } from './predictionReportService';

vi.mock('@/utils/predictionAccess', () => ({
  assertSuperAdminAccess: vi.fn(),
}));

const { assertSuperAdminAccess } = await import('@/utils/predictionAccess');

describe('predictionReportService', () => {
  it('delegates orchestration snapshot access through the super-admin guard', () => {
    const report = { adminSnapshot: { totalPaths: 42 } } as never;
    const profile = { level: 'level_4' } as never;

    const snapshot = getAdminOrchestrationSnapshot(report, profile);

    expect(assertSuperAdminAccess).toHaveBeenCalledWith(profile);
    expect(snapshot).toEqual(report.adminSnapshot);
  });
});
