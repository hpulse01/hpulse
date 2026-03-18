import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SuperAdminRoute } from './SuperAdminRoute';

vi.mock('@/hooks/useAdminAccess', () => ({
  useAdminAccess: vi.fn(),
}));

const { useAdminAccess } = await import('@/hooks/useAdminAccess');

describe('SuperAdminRoute', () => {
  it('renders children for super admins only', () => {
    vi.mocked(useAdminAccess).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: true,
      level: 'level_4',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SuperAdminRoute><div>secret</div></SuperAdminRoute>
      </MemoryRouter>,
    );

    expect(html).toContain('secret');
  });
});
