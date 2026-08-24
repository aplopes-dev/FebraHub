/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PatientBudgetOdontogram } from './patient-budget-odontogram';

vi.mock('next/image', () => ({
  default: (props: { alt?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element -- test stub
    return <img alt={props.alt ?? ''} />;
  },
}));

vi.mock('./odontogram-hof-draw-layer', () => ({
  OdontogramHofDrawLayer: () => <div data-testid="hof-draw-layer" />,
}));

afterEach(() => {
  cleanup();
});

describe('PatientBudgetOdontogram', () => {
  it('toggles a tooth into the selection via onChange', () => {
    const onChange = vi.fn();

    render(
      <PatientBudgetOdontogram
        value={[]}
        onChange={onChange}
        hofRegionIds={[]}
        onHofChange={vi.fn()}
        toothFaces={{}}
        onToothFacesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dente 11' }));

    expect(onChange).toHaveBeenCalledWith([11]);
  });

  it('toggles region labels without selecting teeth', () => {
    const onChange = vi.fn();
    const onRegionLabelsChange = vi.fn();

    render(
      <PatientBudgetOdontogram
        value={[]}
        onChange={onChange}
        regionLabels={[]}
        onRegionLabelsChange={onRegionLabelsChange}
        hofRegionIds={[]}
        onHofChange={vi.fn()}
        toothFaces={{}}
        onToothFacesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Maxila' }));

    expect(onRegionLabelsChange).toHaveBeenCalledWith(['Maxila']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows draw tools when HOF Desenhar mode is selected', () => {
    render(
      <PatientBudgetOdontogram
        value={[]}
        onChange={vi.fn()}
        hofRegionIds={[]}
        onHofChange={vi.fn()}
        hofAnnotations={null}
        onHofAnnotationsChange={vi.fn()}
        toothFaces={{}}
        onToothFacesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'HOF' }));
    expect(screen.getByRole('button', { name: 'Região' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ponto' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Desenhar' }));

    expect(screen.getByRole('button', { name: 'Ponto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Risco' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borracha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selecionar' })).toBeInTheDocument();
  });

  it('opens expanded HOF dialog from the maximize button', () => {
    render(
      <PatientBudgetOdontogram
        value={[]}
        onChange={vi.fn()}
        hofRegionIds={[]}
        onHofChange={vi.fn()}
        hofAnnotations={null}
        onHofAnnotationsChange={vi.fn()}
        toothFaces={{}}
        onToothFacesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'HOF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expandir mapa facial' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mapa facial (HOF)' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Desenhar' }).length).toBeGreaterThan(0);
  });

  it('respects controlled tab prop for Harmonização Facial flow', () => {
    render(
      <PatientBudgetOdontogram
        value={[]}
        onChange={vi.fn()}
        hofRegionIds={[]}
        onHofChange={vi.fn()}
        toothFaces={{}}
        onToothFacesChange={vi.fn()}
        tab="hof"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'HOF' }).className).toMatch(/is-active/);
    expect(screen.getByRole('button', { name: 'Região' })).toBeInTheDocument();
  });
});
