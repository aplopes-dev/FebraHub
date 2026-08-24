/** @vitest-environment jsdom */
import { useRef, type ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PatientToothAnnotation } from '../../../types/patient-tooth-annotation';
import { PatientToothAnnotationsDialog } from './patient-tooth-annotations-dialog';

afterEach(() => {
  cleanup();
});

function DialogHarness(
  props: Omit<ComponentProps<typeof PatientToothAnnotationsDialog>, 'anchorRef'>,
) {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div ref={anchorRef} data-testid="tooth-anchor" />
      <PatientToothAnnotationsDialog {...props} anchorRef={anchorRef} />
    </>
  );
}

describe('PatientToothAnnotationsDialog', () => {
  it('renders title, input and existing annotation with delete action', () => {
    const annotation: PatientToothAnnotation = {
      id: 'a1',
      toothNumber: 12,
      content: 'Observação clínica',
      professionalName: 'Dr. Ana Silva',
      createdAt: '2026-07-27T12:00:00.000Z',
    };
    const onDelete = vi.fn();

    render(
      <DialogHarness
        toothNumber={12}
        annotations={[annotation]}
        onOpenChange={() => undefined}
        onAddAnnotation={() => undefined}
        onDeleteAnnotation={onDelete}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Dente 12' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adicionar anotações...')).toBeInTheDocument();
    expect(screen.getByText(/Por Dr\. Ana Silva em/)).toBeInTheDocument();
    expect(screen.getByText('Observação clínica')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir anotação' }));
    expect(onDelete).toHaveBeenCalledWith(12, 'a1');
  });

  it('submits draft on Enter and Adicionar', () => {
    const onAdd = vi.fn();

    render(
      <DialogHarness
        toothNumber={21}
        annotations={[]}
        onOpenChange={() => undefined}
        onAddAnnotation={onAdd}
        onDeleteAnnotation={() => undefined}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Adicionar anotações' });
    fireEvent.change(input, { target: { value: '  nota  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith(21, 'nota');

    fireEvent.change(input, { target: { value: 'segunda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith(21, 'segunda');
  });

  it('limits annotation draft to 255 characters', () => {
    const onAdd = vi.fn();
    const longText = 'a'.repeat(300);

    render(
      <DialogHarness
        toothNumber={21}
        annotations={[]}
        onOpenChange={() => undefined}
        onAddAnnotation={onAdd}
        onDeleteAnnotation={() => undefined}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Adicionar anotações' });
    fireEvent.change(input, { target: { value: longText } });

    expect(input).toHaveValue('a'.repeat(255));
    expect(screen.getByText('255/255')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith(21, 'a'.repeat(255));
  });
});
