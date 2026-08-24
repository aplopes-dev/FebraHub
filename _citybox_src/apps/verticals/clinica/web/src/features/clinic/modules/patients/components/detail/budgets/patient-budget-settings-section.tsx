'use client';

import { Info } from 'lucide-react';
import {
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import type {
  PatientBudgetPrintSettings,
  PatientBudgetRejectionDraft,
  PatientBudgetStatusSelection,
} from '../../../types/patient-budget-form';

const REJECTION_REASON_MAX_LENGTH = 255;

type PatientBudgetSettingsSectionProps = {
  showStatusSelect: boolean;
  statusSelection: PatientBudgetStatusSelection;
  rejection: PatientBudgetRejectionDraft;
  emitContractOnApprove: boolean;
  printSettings: PatientBudgetPrintSettings;
  installmentEnabled: boolean;
  disabled?: boolean;
  rejectionDateError?: string;
  rejectionReasonError?: string;
  onStatusSelectionChange: (status: PatientBudgetStatusSelection) => void;
  onRejectionChange: (rejection: PatientBudgetRejectionDraft) => void;
  onEmitContractOnApproveChange: (enabled: boolean) => void;
  onPrintSettingsChange: (settings: PatientBudgetPrintSettings) => void;
};

export function PatientBudgetSettingsSection({
  showStatusSelect,
  statusSelection,
  rejection,
  emitContractOnApprove,
  printSettings,
  installmentEnabled,
  disabled = false,
  rejectionDateError,
  rejectionReasonError,
  onStatusSelectionChange,
  onRejectionChange,
  onEmitContractOnApproveChange,
  onPrintSettingsChange,
}: PatientBudgetSettingsSectionProps) {
  const isRejected = statusSelection === 'rejected';

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      {showStatusSelect ? (
        <div className="space-y-3">
          <div className={isRejected ? 'grid grid-cols-2 gap-2' : ''}>
            <div className="space-y-1.5">
              <Label htmlFor="patient-budget-status">Status</Label>
              <Select
                value={statusSelection}
                onValueChange={(value) =>
                  onStatusSelectionChange(value as PatientBudgetStatusSelection)
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id="patient-budget-status"
                  className={isRejected ? 'w-full' : 'w-40'}
                >
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Em aberto</SelectItem>
                  <SelectItem value="rejected">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRejected ? (
              <div className="space-y-1.5">
                <Label>Data da reprovação</Label>
                <DatePicker
                  value={rejection.date ?? undefined}
                  placeholder="Selecionar data"
                  className="w-full"
                  disabled={disabled}
                  onChange={(date) =>
                    onRejectionChange({
                      ...rejection,
                      date: date ?? null,
                    })
                  }
                />
                {rejectionDateError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {rejectionDateError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {isRejected ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="patient-budget-rejection-reason">Motivo</Label>
                  <span className="text-xs text-muted-foreground">
                    {rejection.reason.length}/{REJECTION_REASON_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="patient-budget-rejection-reason"
                  value={rejection.reason}
                  onChange={(event) =>
                    onRejectionChange({
                      ...rejection,
                      reason: event.target.value.slice(0, REJECTION_REASON_MAX_LENGTH),
                    })
                  }
                  placeholder="Informe o motivo da reprovação"
                  disabled={disabled}
                  maxLength={REJECTION_REASON_MAX_LENGTH}
                  className="min-h-20 resize-y"
                  aria-invalid={!!rejectionReasonError}
                />
                {rejectionReasonError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {rejectionReasonError}
                  </p>
                ) : null}
              </div>

              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                Caso queira aprovar esse orçamento futuramente, altere o status para em aberto.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="patient-budget-emit-contract" className="text-sm font-medium">
            Emitir contrato ao aprovar orçamento
          </Label>
          <Switch
            id="patient-budget-emit-contract"
            checked={emitContractOnApprove}
            disabled={disabled}
            onCheckedChange={onEmitContractOnApproveChange}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Se tiver ativado, o contrato já aparece assim que o orçamento for aprovado.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            Configurações de impressão do orçamento
          </h4>
          <p className="text-sm text-muted-foreground">
            Abaixo estão as opções para configurar a impressão do seu orçamento. Ao ativá-las, você
            decide mostrar as informações
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="patient-budget-print-total"
              checked={printSettings.totalValue}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onPrintSettingsChange({
                  ...printSettings,
                  totalValue: checked === true,
                })
              }
            />
            <Label htmlFor="patient-budget-print-total" className="text-sm font-medium">
              Valor total
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="patient-budget-print-treatments"
              checked={printSettings.treatmentValues}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onPrintSettingsChange({
                  ...printSettings,
                  treatmentValues: checked === true,
                })
              }
            />
            <Label htmlFor="patient-budget-print-treatments" className="text-sm font-medium">
              Valor por procedimento
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="patient-budget-print-installments"
              checked={installmentEnabled && printSettings.installments}
              disabled={disabled || !installmentEnabled}
              onCheckedChange={(checked) =>
                onPrintSettingsChange({
                  ...printSettings,
                  installments: checked === true,
                })
              }
            />
            <Label
              htmlFor="patient-budget-print-installments"
              className={
                installmentEnabled
                  ? 'text-sm font-medium'
                  : 'text-sm font-medium text-muted-foreground'
              }
            >
              Parcelas
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="patient-budget-print-dentist"
              checked={printSettings.dentist}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onPrintSettingsChange({
                  ...printSettings,
                  dentist: checked === true,
                })
              }
            />
            <Label htmlFor="patient-budget-print-dentist" className="text-sm font-medium">
              Profissional
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
