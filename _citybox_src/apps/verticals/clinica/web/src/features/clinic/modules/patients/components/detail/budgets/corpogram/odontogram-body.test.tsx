import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OdontogramBody } from './odontogram-body';

describe('OdontogramBody', () => {
  it('renders corpogram and toggles region on click', () => {
    const onRegionToggle = vi.fn();

    render(
      <OdontogramBody
        selectedRegionIds={[]}
        onRegionToggle={onRegionToggle}
      />,
    );

    expect(screen.getByTestId('corpogram-body')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Quadril Direito' })[0]!);

    expect(onRegionToggle).toHaveBeenCalledWith('quadril-direito');
  });

  it('does not toggle regions when readOnly', () => {
    const onRegionToggle = vi.fn();

    render(
      <OdontogramBody
        selectedRegionIds={[]}
        readOnly
        onRegionToggle={onRegionToggle}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Quadril Direito' })[0]!);

    expect(onRegionToggle).not.toHaveBeenCalled();
  });

  it('lists selected regions in summary', () => {
    render(
      <OdontogramBody
        selectedRegionIds={['quadril-direito', 'joelho-esquerdo']}
        onRegionToggle={() => undefined}
      />,
    );

    expect(screen.getByText(/Quadril Direito/)).toBeInTheDocument();
    expect(screen.getByText(/Joelho Esquerdo/)).toBeInTheDocument();
  });
});
