import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';

vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: vi.fn(),
}));

const { useRoleAccess } = await import('@/hooks/useRoleAccess');

describe('AdminRoute', () => {
  it('renders children for admins', () => {
    vi.mocked(useRoleAccess).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      isSuperAdmin: false,
      level: 'level_3',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminRoute><div>admin-area</div></AdminRoute>
      </MemoryRouter>,
    );

    expect(html).toContain('admin-area');
  });
});
