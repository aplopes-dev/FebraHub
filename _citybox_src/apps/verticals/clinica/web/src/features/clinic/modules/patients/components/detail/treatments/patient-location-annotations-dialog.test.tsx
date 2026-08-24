/** @vitest-environment jsdom */
import { useRef, type ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PatientLocationAnnotationsDialog } from './patient-location-annotations-dialog';

afterEach(() => {
  cleanup();
});

function DialogHarness(
  props: Omit<ComponentProps<typeof PatientLocationAnnotationsDialog>, 'anchorRef'>,
) {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div ref={anchorRef} data-testid="region-anchor" />
      <PatientLocationAnnotationsDialog {...props} anchorRef={anchorRef} />
    </>
  );
}

describe('PatientLocationAnnotationsDialog', () => {
  it('renders region title and empty state', () => {
    render(
      <DialogHarness
        locationKey="ombro-direito"
        title="Ombro Direito"
        emptyMessage="Nenhuma anotação nesta região."
        annotations={[]}
        onOpenChange={() => undefined}
        onAddAnnotation={() => undefined}
        onDeleteAnnotation={() => undefined}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Ombro Direito' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma anotação nesta região.')).toBeInTheDocument();
  });

  it('submits annotation for a body region key', () => {
    const onAdd = vi.fn();

    render(
      <DialogHarness
        locationKey="ombro-direito"
        title="Ombro Direito"
        emptyMessage="Nenhuma anotação nesta região."
        annotations={[]}
        onOpenChange={() => undefined}
        onAddAnnotation={onAdd}
        onDeleteAnnotation={() => undefined}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Adicionar anotações' });
    fireEvent.change(input, { target: { value: 'Dor ao elevação' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith('ombro-direito', 'Dor ao elevação');
  });
});
