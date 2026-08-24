'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import type { PatientFormValues } from '../types/patient-form';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';
import { PatientReferralOriginCreatePopover } from './patient-referral-origin-create-popover';

const ORIGIN_TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type PatientReferralOriginFieldProps = {
  origins: PatientReferralOrigin[];
  values: Pick<
    PatientFormValues,
    | 'referralOriginId'
    | 'referralOriginSystemKey'
    | 'referredByPatientId'
    | 'referredByPatientName'
    | 'referredByMemberId'
    | 'referredByMemberName'
    | 'referredByExternalProfessionalId'
    | 'referredByExternalProfessionalName'
  >;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
  onCreateOrigin: (input: PatientReferralOriginInput) => Promise<PatientReferralOrigin>;
};

function buildOriginPatch(
  origin: PatientReferralOrigin,
  previousSystemKey: PatientFormValues['referralOriginSystemKey'],
): Partial<PatientFormValues> {
  const nextSystemKey = origin.systemKey ?? '';
  const patch: Partial<PatientFormValues> = {
    referralOriginId: origin.id,
    referralOriginSystemKey: nextSystemKey,
  };

  if (nextSystemKey !== 'indicacao' && previousSystemKey === 'indicacao') {
    patch.referredByPatientId = '';
    patch.referredByPatientName = '';
  }

  if (
    nextSystemKey !== 'indicacao_profissional' &&
    previousSystemKey === 'indicacao_profissional'
  ) {
    patch.referredByMemberId = '';
    patch.referredByMemberName = '';
  }

  if (
    nextSystemKey !== 'indicacao_profissional_externo' &&
    previousSystemKey === 'indicacao_profissional_externo'
  ) {
    patch.referredByExternalProfessionalId = '';
    patch.referredByExternalProfessionalName = '';
  }

  return patch;
}

export function PatientReferralOriginField({
  origins,
  values,
  disabled = false,
  onPatch,
  onCreateOrigin,
}: PatientReferralOriginFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const selectedOrigin = origins.find((origin) => origin.id === values.referralOriginId);

  const handleCreate = async (input: PatientReferralOriginInput) => {
    const origin = await onCreateOrigin(input);
    onPatch(buildOriginPatch(origin, values.referralOriginSystemKey));
  };

  const handleAddOriginClick = () => {
    setDropdownOpen(false);
    setCreateOpen(true);
  };

  const handleSelectOrigin = (origin: PatientReferralOrigin) => {
    onPatch(buildOriginPatch(origin, values.referralOriginSystemKey));
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="patient-referral-origin">Como chegou à clínica</Label>
      <div ref={anchorRef}>
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              id="patient-referral-origin"
              type="button"
              role="combobox"
              aria-expanded={dropdownOpen}
              disabled={disabled}
              className={cn(
                ORIGIN_TRIGGER_CLASS,
                !selectedOrigin && 'text-muted-foreground',
              )}
            >
              {selectedOrigin ? (
                <span className="truncate">{selectedOrigin.name}</span>
              ) : (
                <span>Selecionar</span>
              )}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={4}
            className={cn(
              'w-[var(--radix-popover-trigger-width)] gap-0 p-0',
              CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
            )}
          >
            <div className="p-1.5">
              {origins.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhuma origem cadastrada
                </p>
              ) : (
                origins.map((origin) => (
                  <button
                    key={origin.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      values.referralOriginId === origin.id &&
                        'bg-accent text-accent-foreground',
                    )}
                    onClick={() => handleSelectOrigin(origin)}
                  >
                    {origin.name}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border/60 p-1.5">
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full justify-start gap-2 px-2 font-normal"
                onClick={handleAddOriginClick}
              >
                <Plus className="size-4" aria-hidden />
                Nova origem
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {createOpen ? (
        <PatientReferralOriginCreatePopover
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={(input) => void handleCreate(input)}
          anchorRef={anchorRef}
        />
      ) : null}
    </div>
  );
}
