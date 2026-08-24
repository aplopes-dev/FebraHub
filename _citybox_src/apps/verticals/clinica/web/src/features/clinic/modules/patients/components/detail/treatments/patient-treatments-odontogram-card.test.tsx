/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PatientTreatment } from '../../../types/patient-treatment';
import type { PatientToothAnnotation } from '../../../types/patient-tooth-annotation';
import { PatientTreatmentsOdontogramCard } from './patient-treatments-odontogram-card';

vi.mock('next/image', () => ({
  default: (props: { alt?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element -- test stub
    return <img alt={props.alt ?? ''} />;
  },
}));

vi.mock('../budgets/odontogram/odontogram-hof-draw-layer', () => ({
  OdontogramHofDrawLayer: () => <div data-testid="hof-draw-layer" />,
}));

vi.mock('@/lib/session-context', () => ({
  useSession: () => ({
    status: 'authenticated',
    session: { user: { name: 'Dr. Ana Silva' } },
  }),
}));

vi.mock('@/lib/store-context', () => ({
  useStore: () => ({ storeId: 'store-1' }),
}));

const annotationsStore = vi.hoisted(() => {
  let items: PatientToothAnnotation[] = [];
  const listeners = new Set<() => void>();
  let refetchGate: Promise<void> | null = null;

  return {
    get: () => items,
    set: (next: PatientToothAnnotation[]) => {
      items = next;
      for (const listener of listeners) listener();
    },
    reset: () => {
      items = [];
      refetchGate = null;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setRefetchGate: (promise: Promise<void> | null) => {
      refetchGate = promise;
    },
    waitRefetchGate: async () => {
      if (refetchGate) {
        await refetchGate;
      }
    },
  };
});

vi.mock('../../../hooks/use-patient-tooth-annotations-queries', async () => {
  const React = await import('react');

  return {
    usePatientToothAnnotationsQuery: () => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => annotationsStore.subscribe(() => setTick((n) => n + 1)), []);
      return {
        data: annotationsStore.get(),
        isLoading: false,
        refetch: vi.fn(async () => {
          await annotationsStore.waitRefetchGate();
          return { data: annotationsStore.get() };
        }),
      };
    },
    usePatientToothAnnotationMutations: () => ({
      createMutation: {
        mutateAsync: vi.fn(
          async (input: { toothNumber: number; content: string; professionalName: string }) => {
            const next: PatientToothAnnotation = {
              id: `ann-${annotationsStore.get().length + 1}`,
              toothNumber: input.toothNumber,
              content: input.content,
              professionalName: input.professionalName,
              createdAt: new Date().toISOString(),
            };
            annotationsStore.set([...annotationsStore.get(), next]);
            return next;
          },
        ),
        isPending: false,
      },
      deleteMutation: {
        mutateAsync: vi.fn(async (annotationId: string) => {
          annotationsStore.set(
            annotationsStore.get().filter((item) => item.id !== annotationId),
          );
        }),
        isPending: false,
      },
    }),
    getPatientToothAnnotationMutationErrorMessage: () => 'Erro',
  };
});

afterEach(() => {
  cleanup();
  annotationsStore.reset();
});

function buildTreatment(
  overrides: Partial<PatientTreatment> & Pick<PatientTreatment, 'id' | 'status' | 'toothNumber'>,
): PatientTreatment {
  return {
    patientId: 'p1',
    source: 'standalone',
    description: 'Teste',
    valueCents: 1000,
    ...overrides,
  };
}

describe('PatientTreatmentsOdontogramCard', () => {
  it('renders odontogram without HOF tab and status filters with annotations heading', () => {
    render(<PatientTreatmentsOdontogramCard patientId="p1" />);

    expect(screen.getByRole('heading', { name: 'Odontograma' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fechar|Abrir/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PERMANENTES' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DECÍDUOS' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'HOF' })).not.toBeInTheDocument();

    expect(screen.getByRole('checkbox', { name: 'Aberto' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Finalizado' })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'Anotações' })).toBeInTheDocument();
  });

  it('toggles Aberto and Finalizado checkboxes', () => {
    render(<PatientTreatmentsOdontogramCard patientId="p1" />);

    const openCheckbox = screen.getByRole('checkbox', { name: 'Aberto' });
    fireEvent.click(openCheckbox);
    expect(openCheckbox).not.toBeChecked();

    const finalizedCheckbox = screen.getByRole('checkbox', { name: 'Finalizado' });
    fireEvent.click(finalizedCheckbox);
    expect(finalizedCheckbox).not.toBeChecked();
  });

  it('paints open teeth yellow and finalized green for standalone and budget', () => {
    render(
      <PatientTreatmentsOdontogramCard
        patientId="p1"
        treatments={[
          buildTreatment({ id: 't1', status: 'active', toothNumber: 13, source: 'standalone' }),
          buildTreatment({ id: 't2', status: 'finalized', toothNumber: 21, source: 'standalone' }),
          buildTreatment({ id: 't3', status: 'active', toothNumber: 11, source: 'budget' }),
        ]}
      />,
    );

    const openTooth = document.querySelector('[data-tooth="13"]');
    const finalizedTooth = document.querySelector('[data-tooth="21"]');
    const budgetTooth = document.querySelector('[data-tooth="11"]');

    expect(openTooth).toHaveAttribute('data-treatment-status', 'open');
    expect(finalizedTooth).toHaveAttribute('data-treatment-status', 'finalized');
    expect(budgetTooth).toHaveAttribute('data-treatment-status', 'open');
    expect(openTooth?.querySelector('.tooth__crown')).toHaveClass('is-status-open');
    expect(finalizedTooth?.querySelector('.tooth__crown')).toHaveClass('is-status-finalized');
    expect(budgetTooth?.querySelector('.tooth__crown')).toHaveClass('is-status-open');
  });

  it('paints tooth green when latest treatment is finalized even if an older active remains', () => {
    render(
      <PatientTreatmentsOdontogramCard
        patientId="p1"
        treatments={[
          buildTreatment({
            id: 't-old',
            status: 'active',
            toothNumber: 13,
            source: 'budget',
            createdAt: '2026-07-15T12:00:00.000Z',
          }),
          buildTreatment({
            id: 't-new',
            status: 'finalized',
            toothNumber: 13,
            source: 'standalone',
            createdAt: '2026-07-20T12:00:00.000Z',
            finalizedAt: '2026-07-27T15:00:00.000Z',
          }),
        ]}
      />,
    );

    expect(document.querySelector('[data-tooth="13"]')).toHaveAttribute(
      'data-treatment-status',
      'finalized',
    );
    expect(document.querySelector('.tooth__crown.is-status-finalized')).toBeInTheDocument();
  });

  it('paints budget-approved teeth as open', () => {
    render(
      <PatientTreatmentsOdontogramCard
        patientId="p1"
        treatments={[
          buildTreatment({ id: 't1', status: 'active', toothNumber: 13, source: 'budget' }),
        ]}
      />,
    );

    expect(document.querySelector('[data-tooth="13"]')).toHaveAttribute(
      'data-treatment-status',
      'open',
    );
    expect(document.querySelector('.tooth__crown.is-status-open')).toBeInTheDocument();
  });

  it('hides open status when Aberto checkbox is unchecked', () => {
    render(
      <PatientTreatmentsOdontogramCard
        patientId="p1"
        treatments={[buildTreatment({ id: 't1', status: 'active', toothNumber: 13 })]}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Aberto' }));

    expect(document.querySelector('[data-tooth="13"]')).not.toHaveAttribute(
      'data-treatment-status',
    );
  });

  it('opens tooth annotations dialog on tooth click and supports add/delete', async () => {
    render(<PatientTreatmentsOdontogramCard patientId="p1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Dente 12' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dente 12' })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Adicionar anotações...')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Adicionar anotações' });
    fireEvent.change(input, { target: { value: 'Cárie oclusal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(screen.getByText(/Por Dr\. Ana Silva em/)).toBeInTheDocument();
      expect(screen.getByText('Cárie oclusal')).toBeInTheDocument();
    });

    const annotatedTooth = document.querySelector('[data-tooth="12"]');
    expect(annotatedTooth).toHaveAttribute('data-has-annotation', 'true');
    expect(annotatedTooth?.querySelector('.tooth__annotation-mark')).toHaveTextContent('!');
    expect(screen.getByRole('button', { name: 'Dente 12, com anotações' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir anotação' }));

    await waitFor(() => {
      expect(screen.queryByText('Cárie oclusal')).not.toBeInTheDocument();
      expect(screen.getByText('Nenhuma anotação neste dente.')).toBeInTheDocument();
    });
    expect(document.querySelector('[data-tooth="12"]')).not.toHaveAttribute(
      'data-has-annotation',
    );
  });

  it('shows crown loading before opening annotations popover', async () => {
    let resolveRefetch: (() => void) | null = null;
    annotationsStore.setRefetchGate(
      new Promise<void>((resolve) => {
        resolveRefetch = resolve;
      }),
    );

    render(<PatientTreatmentsOdontogramCard patientId="p1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Dente 12' }));

    await waitFor(() => {
      expect(document.querySelector('[data-tooth="12"]')).toHaveAttribute('data-loading', 'true');
      expect(
        screen.getByRole('button', { name: 'Dente 12, carregando anotações' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Dente 12' })).not.toBeInTheDocument();

    resolveRefetch?.();

    await waitFor(() => {
      expect(document.querySelector('[data-tooth="12"]')).not.toHaveAttribute('data-loading');
      expect(screen.getByRole('heading', { name: 'Dente 12' })).toBeInTheDocument();
    });
  });

  it('does not toggle tooth selection when opening annotations dialog', async () => {
    render(<PatientTreatmentsOdontogramCard patientId="p1" />);

    const tooth = screen.getByRole('button', { name: 'Dente 12' });
    fireEvent.click(tooth);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dente 12' })).toBeInTheDocument();
    });
    expect(tooth).toHaveAttribute('aria-pressed', 'false');
  });
});
