import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPageFrame } from './dashboard-page-frame';
import { DashboardRouteNav } from './dashboard-route-nav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const useCanMock = vi.fn(
  (action: string, _subject: string) =>
    action === 'read' || action === 'access',
);

vi.mock('@/features/clinic/permissions', () => ({
  useCan: (action: string, subject: string) => useCanMock(action, subject),
}));

afterEach(() => {
  cleanup();
  useCanMock.mockImplementation(
    (action: string) => action === 'read' || action === 'access',
  );
});

describe('DashboardRouteNav', () => {
  it('renderiza as três abas como rotas e destaca Indicadores', () => {
    render(<DashboardRouteNav />);

    expect(screen.getByRole('link', { name: 'Indicadores' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Relatórios' })).toHaveAttribute(
      'href',
      '/relatorios',
    );
    expect(screen.queryByRole('link', { name: 'Ortodontia' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toHaveAttribute(
      'href',
      '/tarefas',
    );
    expect(screen.getByRole('link', { name: 'Indicadores' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('navigation', {
        name: 'Navegação do dashboard da Clínica',
      }).parentElement,
    ).toHaveClass('-mx-4', '-mt-4', 'bg-background', 'px-4');
  });

  it('oculta Indicadores/Relatórios sem read Dashboard', () => {
    useCanMock.mockImplementation((action: string) => action === 'access');
    render(<DashboardRouteNav />);
    expect(screen.queryByRole('link', { name: 'Indicadores' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Relatórios' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toBeInTheDocument();
  });

  it('aplica o fundo cinza no frame da página', () => {
    const { container } = render(
      <DashboardPageFrame>
        <div>Conteúdo</div>
      </DashboardPageFrame>,
    );

    expect(container.firstElementChild?.className).toContain(
      'bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))]',
    );
    expect(container.firstElementChild).toHaveClass('shrink-0');
  });
});
