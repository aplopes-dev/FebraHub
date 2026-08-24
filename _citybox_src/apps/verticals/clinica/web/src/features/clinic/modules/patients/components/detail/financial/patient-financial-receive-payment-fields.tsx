'use client';

import { cn } from '@citybox/ui';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { maskCpfCnpj, maskDigitsOnly } from '../../../lib/format-patient-contact';
import type { PatientFinancialReceiveFormValues } from '../../../types/patient-financial-receive-form';

const FIELD_CLASS = 'w-full border-border bg-input/50 hover:bg-input/60';
const FIELD_GROUP_CLASS = 'space-y-2';
const FIELD_ROW_GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-x-6 md:gap-y-4';
const SELECT_CONTENT_CLASS = cn(CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS);
const DATE_PICKER_POPOVER_CLASS = CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS;

export type FinancialCashRegisterOption = {
  id: string;
  name: string;
};

type PatientFinancialReceivePaymentFieldsProps = {
  values: PatientFinancialReceiveFormValues;
  disabled?: boolean;
  cashRegisters?: FinancialCashRegisterOption[];
  dateLabel?: string;
  onChange: (partial: Partial<PatientFinancialReceiveFormValues>) => void;
};

function PaymentAmountRow({
  values,
  disabled,
  cashRegisters = [],
  dateLabel = 'Data de recebimento',
  onChange,
}: PatientFinancialReceivePaymentFieldsProps) {
  return (
    <div className={FIELD_ROW_GRID_CLASS}>
      <div className={FIELD_GROUP_CLASS}>
        <Label htmlFor="patient-financial-receive-paid-amount">Valor pago</Label>
        <PlanBrlCurrencyInput
          id="patient-financial-receive-paid-amount"
          value={values.paidAmount}
          onValueChange={(paidAmount) => onChange({ paidAmount })}
          disabled={disabled}
          className={FIELD_CLASS}
        />
      </div>

      <div className={FIELD_GROUP_CLASS}>
        <Label>{dateLabel}</Label>
        <DatePicker
          value={values.receivedDate ?? undefined}
          placeholder="Selecionar data"
          className="h-9 min-h-9 w-full border-border bg-input/50"
          popoverClassName={DATE_PICKER_POPOVER_CLASS}
          disabled={disabled}
          onChange={(date) => onChange({ receivedDate: date ?? null })}
        />
      </div>

      <div className={FIELD_GROUP_CLASS}>
        <Label htmlFor="patient-financial-receive-cash-register">Caixa</Label>
        <Select
          value={values.cashRegisterId || undefined}
          onValueChange={(cashRegisterId) => onChange({ cashRegisterId })}
          disabled={disabled}
        >
          <SelectTrigger id="patient-financial-receive-cash-register" className={FIELD_CLASS}>
            <SelectValue placeholder="Selecionar caixa" />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLASS} position="popper">
            {cashRegisters.map((register) => (
              <SelectItem key={register.id} value={register.id}>
                {register.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ObservationsField({
  values,
  disabled,
  onChange,
}: PatientFinancialReceivePaymentFieldsProps) {
  return (
    <Textarea
      value={values.observations}
      onChange={(event) => onChange({ observations: event.target.value })}
      placeholder="Observação"
      disabled={disabled}
      className="min-h-24 resize-y border-border bg-input/50"
    />
  );
}

function CardModeSelect({
  values,
  disabled,
  onChange,
  paymentLabel,
}: PatientFinancialReceivePaymentFieldsProps & { paymentLabel: 'Crédito' | 'Débito' }) {
  return (
    <div className={FIELD_GROUP_CLASS}>
      <Label htmlFor="patient-financial-receive-card-mode">{paymentLabel}</Label>
      <Select
        value={values.cardMode}
        onValueChange={(cardMode) =>
          onChange({ cardMode: cardMode as PatientFinancialReceiveFormValues['cardMode'] })
        }
        disabled={disabled}
      >
        <SelectTrigger id="patient-financial-receive-card-mode" className={FIELD_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={SELECT_CONTENT_CLASS} position="popper">
          <SelectItem value="no-fee">
            {paymentLabel} — sem taxa de maquininha ativa
          </SelectItem>
          <SelectItem value="with-fee">{paymentLabel} — com taxa de maquininha</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PatientFinancialReceivePaymentFields({
  values,
  disabled = false,
  cashRegisters = [],
  dateLabel,
  onChange,
}: PatientFinancialReceivePaymentFieldsProps) {
  const sharedProps = { values, disabled, cashRegisters, dateLabel, onChange };

  switch (values.paymentMethod) {
    case 'credit':
      return (
        <div className="space-y-5">
          <CardModeSelect {...sharedProps} paymentLabel="Crédito" />
          <PaymentAmountRow {...sharedProps} />
          <ObservationsField {...sharedProps} />
        </div>
      );

    case 'debit':
      return (
        <div className="space-y-5">
          <CardModeSelect {...sharedProps} paymentLabel="Débito" />
          <PaymentAmountRow {...sharedProps} />
          <ObservationsField {...sharedProps} />
        </div>
      );

    case 'check':
      return (
        <div className="space-y-5">
          <PaymentAmountRow {...sharedProps} />

          <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Dados do cheque</p>

            <div className={FIELD_ROW_GRID_CLASS}>
              <div className={FIELD_GROUP_CLASS}>
                <Label>Data</Label>
                <DatePicker
                  value={values.checkIssueDate ?? undefined}
                  placeholder="Selecionar data"
                  className="h-9 min-h-9 w-full border-border bg-input/50"
                  popoverClassName={DATE_PICKER_POPOVER_CLASS}
                  disabled={disabled}
                  onChange={(date) => onChange({ checkIssueDate: date ?? null })}
                />
              </div>

              <div className={FIELD_GROUP_CLASS}>
                <Label htmlFor="patient-financial-receive-check-holder">Nome do cheque</Label>
                <Input
                  id="patient-financial-receive-check-holder"
                  value={values.checkHolderName}
                  onChange={(event) => onChange({ checkHolderName: event.target.value })}
                  disabled={disabled}
                  className={FIELD_CLASS}
                />
              </div>

              <div className={FIELD_GROUP_CLASS}>
                <Label htmlFor="patient-financial-receive-check-number">Número do cheque</Label>
                <Input
                  id="patient-financial-receive-check-number"
                  value={values.checkNumber}
                  inputMode="numeric"
                  onChange={(event) =>
                    onChange({ checkNumber: maskDigitsOnly(event.target.value) })
                  }
                  disabled={disabled}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
              <div className={FIELD_GROUP_CLASS}>
                <Label htmlFor="patient-financial-receive-check-bank">Banco</Label>
                <Input
                  id="patient-financial-receive-check-bank"
                  value={values.checkBank}
                  onChange={(event) => onChange({ checkBank: event.target.value })}
                  disabled={disabled}
                  className={FIELD_CLASS}
                />
              </div>

              <div className={FIELD_GROUP_CLASS}>
                <Label htmlFor="patient-financial-receive-check-document">CPF/CNPJ</Label>
                <Input
                  id="patient-financial-receive-check-document"
                  value={values.checkDocument}
                  inputMode="numeric"
                  onChange={(event) =>
                    onChange({ checkDocument: maskCpfCnpj(event.target.value) })
                  }
                  disabled={disabled}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>

          <ObservationsField {...sharedProps} />
        </div>
      );

    default:
      return (
        <div className="space-y-5">
          <PaymentAmountRow {...sharedProps} />
          <ObservationsField {...sharedProps} />
        </div>
      );
  }
}
