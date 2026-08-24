import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExternalProfessionalFormPopover } from './external-professional-create-popover';

describe('ExternalProfessionalFormPopover', () => {
  it('requires name before save', () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    const anchor = { current: document.createElement('div') };

    render(
      <ExternalProfessionalFormPopover
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        anchorRef={anchor}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Informe o nome do profissional.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
