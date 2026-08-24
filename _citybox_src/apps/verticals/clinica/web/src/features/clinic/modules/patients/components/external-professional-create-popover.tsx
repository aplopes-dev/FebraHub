'use client';

import { useEffect, useState, type RefObject } from 'react';
import { X } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import {
  formatPatientPhone,
  maskPatientPhone,
} from '../lib/format-patient-contact';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';

type ExternalProfessionalFormPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ExternalReferralProfessionalInput) => void;
  anchorRef: RefObject<HTMLDivElement | null>;
  mode?: 'create' | 'edit';
  initialValues?: Pick<ExternalReferralProfessional, 'name' | 'phone' | 'cro'>;
};

export function ExternalProfessionalFormPopover({
  open,
  onOpenChange,
  onSubmit,
  anchorRef,
  mode = 'create',
  initialValues,
}: ExternalProfessionalFormPopoverProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cro, setCro] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setPhone('');
      setCro('');
      setError(null);
      return;
    }

    setName(initialValues?.name ?? '');
    setPhone(
      initialValues?.phone ? formatPatientPhone(initialValues.phone) : '',
    );
    setCro(initialValues?.cro ?? '');
    setError(null);
    // Hidrata só ao abrir (evita reset enquanto digita).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [open]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome do profissional.');
      return;
    }

    onSubmit({
      name: trimmedName,
      phone: phone.trim() || undefined,
      cro: cro.trim() || undefined,
    });
    onOpenChange(false);
  };

  const title = mode === 'edit' ? 'Editar profissional' : 'Novo profissional';

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor
        virtualRef={anchorRef as RefObject<{ getBoundingClientRect: () => DOMRect }>}
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn('w-80 gap-0 p-0', CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS)}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="external-professional-name">Nome</Label>
            <Input
              id="external-professional-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Nome"
              autoFocus
              aria-invalid={!!error}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="external-professional-phone">Celular</Label>
            <Input
              id="external-professional-phone"
              value={phone}
              onChange={(event) => setPhone(maskPatientPhone(event.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="external-professional-cro">CRO / CRM</Label>
            <Input
              id="external-professional-cro"
              value={cro}
              onChange={(event) => setCro(event.target.value)}
              placeholder="CRO / CRM"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** @deprecated Use ExternalProfessionalFormPopover */
export const ExternalProfessionalCreatePopover = ExternalProfessionalFormPopover;
