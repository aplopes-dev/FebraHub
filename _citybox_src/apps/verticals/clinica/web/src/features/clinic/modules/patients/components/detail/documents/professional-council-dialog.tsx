'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import {
  CREFITO_REGIONALS,
  formatCrefitoRegionalOptionLabel,
  formatCrefitoRegionalStorage,
  type ProfessionalCouncilSnapshot,
  type ProfessionalCouncilType,
} from '@citybox/messaging/professional-council';
import { BRAZILIAN_STATES } from '@/features/clinic/modules/settings/lib/brazilian-states';
import { storeCouncilTypes } from '@/lib/clinic-strand';
import type { ClinicStrand } from '@citybox/messaging/clinic-strand';

const COUNCIL_NONE = 'none';

type ProfessionalCouncilDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicStrand?: ClinicStrand | string | null;
  isSubmitting?: boolean;
  onConfirm: (council: ProfessionalCouncilSnapshot) => void;
};

type FormErrors = Partial<
  Record<'councilType' | 'councilNumber' | 'councilUf', string>
>;

function isAllowedCouncilType(
  value: string,
  allowed: readonly string[],
): value is ProfessionalCouncilType {
  return (
    (value === 'CRM' ||
      value === 'CRO' ||
      value === 'CREFITO' ||
      value === 'CRN') &&
    allowed.includes(value)
  );
}

export function ProfessionalCouncilDialog({
  open,
  onOpenChange,
  clinicStrand,
  isSubmitting = false,
  onConfirm,
}: ProfessionalCouncilDialogProps) {
  const allowedTypes = useMemo(() => storeCouncilTypes(clinicStrand), [clinicStrand]);
  const singleCouncilType =
    allowedTypes.length === 1 ? allowedTypes[0] : null;
  const crefitoOnly = singleCouncilType === 'CREFITO';
  const fixedCouncilLabel = singleCouncilType ?? null;

  const [councilType, setCouncilType] = useState<string>(
    fixedCouncilLabel ?? COUNCIL_NONE,
  );
  const [councilNumber, setCouncilNumber] = useState('');
  const [councilUf, setCouncilUf] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setCouncilType(fixedCouncilLabel ?? COUNCIL_NONE);
    setCouncilNumber('');
    setCouncilUf('');
    setErrors({});
  }, [open, fixedCouncilLabel]);

  const handleConfirm = () => {
    const nextErrors: FormErrors = {};
    const resolvedType = fixedCouncilLabel
      ? fixedCouncilLabel
      : isAllowedCouncilType(councilType, allowedTypes)
        ? councilType
        : null;
    const number = councilNumber.trim();
    const uf = councilUf.trim().toUpperCase();

    if (!resolvedType || !allowedTypes.includes(resolvedType)) {
      nextErrors.councilType = 'Selecione o conselho';
    }
    if (!/^\d+$/.test(number)) {
      nextErrors.councilNumber = 'Informe apenas números';
    }
    if (!uf) {
      nextErrors.councilUf = crefitoOnly ? 'Selecione a regional' : 'Selecione a UF';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !resolvedType) {
      return;
    }

    onConfirm({
      councilType: resolvedType as ProfessionalCouncilType,
      councilNumber: number,
      councilUf: uf,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Número da Inscrição no Conselho</DialogTitle>
          <DialogDescription>
            Verifique a inscrição do profissional no conselho ao emitir o documento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-1">
          {!fixedCouncilLabel ? (
            <div className="space-y-1.5">
              <Label htmlFor="professional-council-type">Conselho</Label>
              <Select
                value={councilType}
                onValueChange={setCouncilType}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="professional-council-type"
                  className="w-full"
                  aria-invalid={Boolean(errors.councilType)}
                >
                  <SelectValue placeholder="Não informado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={COUNCIL_NONE}>Não informado</SelectItem>
                  {allowedTypes.includes('CRM') ? (
                    <SelectItem value="CRM">CRM</SelectItem>
                  ) : null}
                  {allowedTypes.includes('CRO') ? (
                    <SelectItem value="CRO">CRO</SelectItem>
                  ) : null}
                  {allowedTypes.includes('CREFITO') ? (
                    <SelectItem value="CREFITO">CREFITO</SelectItem>
                  ) : null}
                  {allowedTypes.includes('CRN') ? (
                    <SelectItem value="CRN">CRN</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              {errors.councilType ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.councilType}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="professional-council-type">Conselho</Label>
              <Input
                id="professional-council-type"
                value={fixedCouncilLabel}
                disabled
                readOnly
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="professional-council-number">Nº do Conselho</Label>
            <Input
              id="professional-council-number"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Somente números"
              value={councilNumber}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.councilNumber)}
              onChange={(event) => {
                setCouncilNumber(event.target.value.replace(/\D/g, ''));
              }}
            />
            {errors.councilNumber ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.councilNumber}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="professional-council-uf">
              {crefitoOnly ? 'Regional CREFITO' : 'UF do Conselho'}
            </Label>
            <Select
              value={councilUf || undefined}
              onValueChange={setCouncilUf}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="professional-council-uf"
                className="w-full"
                aria-invalid={Boolean(errors.councilUf)}
              >
                <SelectValue placeholder={crefitoOnly ? 'Regional' : 'UF'} />
              </SelectTrigger>
              <SelectContent>
                {crefitoOnly
                  ? CREFITO_REGIONALS.map((regional) => (
                      <SelectItem
                        key={regional.number}
                        value={formatCrefitoRegionalStorage(regional.number)}
                      >
                        {formatCrefitoRegionalOptionLabel(regional)}
                      </SelectItem>
                    ))
                  : BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.uf}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            {errors.councilUf ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.councilUf}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
