"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@citybox/ui";
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import { ClinicaApiError } from "@/features/clinic/shared/api";
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from "@/features/clinic/lib/clinic-sheet-styles";
import { formatCentsToBrlInput, parseBrlCurrencyToCents } from "@/features/clinic/modules/patients/lib/patient-budget-form-utils";
import { validatePatientFinancialReceiveForm } from "@/features/clinic/modules/patients/lib/validate-patient-financial-receive-form";
import { PatientFinancialReceiveEntrySummary } from "@/features/clinic/modules/patients/components/detail/financial/patient-financial-receive-entry-summary";
import { PatientFinancialReceivePaymentFields } from "@/features/clinic/modules/patients/components/detail/financial/patient-financial-receive-payment-fields";
import { PatientFinancialReceivePaymentMethodPicker } from "@/features/clinic/modules/patients/components/detail/financial/patient-financial-receive-payment-method-picker";
import {
  EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
  type PatientFinancialCardMode,
  type PatientFinancialPaymentMethod,
  type PatientFinancialReceiveFormValues,
} from "@/features/clinic/modules/patients/types/patient-financial-receive-form";
import { useFinancialAccounts } from "../hooks/use-financial-accounts";
import { useReceiveEntry } from "../hooks/use-receive-entry";
import type { FinancialEntry } from "../types";

type ReceivePaymentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinancialEntry | null;
  viewMode?: boolean;
  /** Em modo visualização: permite anexar comprovante (mock ou API). */
  onAttachReceipt?: (file: File) => void | Promise<void>;
};

const PAYMENT_METHODS = new Set<PatientFinancialPaymentMethod>([
  "cash",
  "credit",
  "debit",
  "pix",
  "transfer",
  "boleto",
  "check",
]);

function toIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDateLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const datePart = iso.substring(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function resolvePaymentMethod(
  method: string | null | undefined,
): PatientFinancialPaymentMethod {
  if (method && PAYMENT_METHODS.has(method as PatientFinancialPaymentMethod)) {
    return method as PatientFinancialPaymentMethod;
  }
  return "cash";
}

function resolveCardMode(
  paymentType: string | null | undefined,
): PatientFinancialCardMode {
  if (!paymentType) return "no-fee";
  if (paymentType === "with-fee" || paymentType.endsWith("-with-fee")) {
    return "with-fee";
  }
  return "no-fee";
}

function buildFormValuesFromEntry(
  entry: FinancialEntry,
  viewMode: boolean,
  defaultCashRegisterId: string,
): PatientFinancialReceiveFormValues {
  if (viewMode) {
    return {
      ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
      paymentMethod: resolvePaymentMethod(entry.paymentMethod),
      paidAmount: formatCentsToBrlInput(
        Math.round((entry.paidValue ?? entry.value) * 100),
      ),
      receivedDate:
        parseIsoDateLocal(entry.paidAt) ??
        parseIsoDateLocal(entry.dueDate) ??
        new Date(),
      cashRegisterId: entry.account?.id ?? defaultCashRegisterId,
      observations: entry.observation ?? "",
      cardMode: resolveCardMode(entry.paymentType),
      checkIssueDate: parseIsoDateLocal(entry.checkDate),
      checkHolderName: entry.checkName ?? "",
      checkNumber: entry.checkNumber ?? "",
      checkBank: entry.checkBank ?? "",
      checkDocument: entry.checkCpfCnpj ?? "",
    };
  }

  return {
    ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
    paidAmount: formatCentsToBrlInput(Math.round(entry.value * 100)),
    receivedDate: new Date(),
    cashRegisterId: defaultCashRegisterId,
  };
}

export function FinancialReceivePaymentSheet({
  open,
  onOpenChange,
  entry,
  viewMode = false,
  onAttachReceipt,
}: ReceivePaymentSheetProps) {
  const [values, setValues] = useState<PatientFinancialReceiveFormValues>(
    EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
  );
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: accounts } = useFinancialAccounts();
  const { mutateAsync: receiveEntry, isPending } = useReceiveEntry();

  const cashRegisters = useMemo(
    () => (accounts ?? []).map((account) => ({ id: account.id, name: account.name })),
    [accounts],
  );

  const defaultCashRegisterId = cashRegisters[0]?.id ?? "";
  const isDisabled = viewMode || isPending;

  useEffect(() => {
    if (!open || !entry) {
      return;
    }

    setValues(buildFormValuesFromEntry(entry, viewMode, defaultCashRegisterId));
  }, [open, entry, viewMode, defaultCashRegisterId]);

  const patchValues = useCallback(
    (partial: Partial<PatientFinancialReceiveFormValues>) => {
      if (viewMode) return;
      setValues((current) => ({ ...current, ...partial }));
    },
    [viewMode],
  );

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!entry || viewMode) {
      return;
    }

    const validationError = validatePatientFinancialReceiveForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!values.receivedDate) {
      return;
    }

    try {
      await receiveEntry({
        id: entry.id,
        data: {
          paymentMethod: values.paymentMethod,
          accountId: values.cashRegisterId,
          paidValue: parseBrlCurrencyToCents(values.paidAmount) / 100,
          receivedAt: toIsoDateOnly(values.receivedDate),
          ...(values.paymentMethod === "credit" || values.paymentMethod === "debit"
            ? { paymentType: values.cardMode }
            : {}),
          observation: values.observations || undefined,
          ...(values.paymentMethod === "check"
            ? {
                checkDate: values.checkIssueDate
                  ? toIsoDateOnly(values.checkIssueDate)
                  : undefined,
                checkName: values.checkHolderName || undefined,
                checkNumber: values.checkNumber || undefined,
                checkBank: values.checkBank || undefined,
                checkCpfCnpj: values.checkDocument || undefined,
              }
            : {}),
        },
      });
      onOpenChange(false);
      toast.success("Recebimento registrado com sucesso");
    } catch (error) {
      const message =
        error instanceof ClinicaApiError
          ? error.message
          : "Erro ao registrar recebimento";
      toast.error(message);
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
          CLINIC_NESTED_SHEET_CONTENT_CLASS,
          "data-[side=right]:sm:max-w-3xl",
        )}
      >
        <SheetHeader
          className={cn(CLINIC_SHEET_HEADER_CLASS, "flex-row items-center justify-between")}
        >
          <SheetTitle>
            {viewMode ? "Detalhes do recebimento" : "Registrar Recebimento"}
          </SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            disabled={isPending}
            onClick={handleClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SheetHeader>

        <div className={cn("relative", CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          {isPending ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Registrando recebimento…
              </div>
            </div>
          ) : null}

          <div className={CLINIC_SHEET_BODY_PADDING_CLASS}>
            <PatientFinancialReceiveEntrySummary
              entry={{
                name: entry.description,
                date: entry.dueDate,
                valueCents: Math.round(entry.value * 100),
                patientName: entry.patient?.name,
              }}
            />

            <div className="mt-8 space-y-2">
              <p className="text-sm font-medium text-foreground">Meios de pagamento</p>
              <PatientFinancialReceivePaymentMethodPicker
                value={values.paymentMethod}
                disabled={isDisabled}
                onChange={(paymentMethod) =>
                  patchValues({
                    paymentMethod,
                    ...(paymentMethod !== "credit" && paymentMethod !== "debit"
                      ? { cardMode: "no-fee" }
                      : {}),
                    ...(paymentMethod !== "check"
                      ? {
                          checkIssueDate: null,
                          checkHolderName: "",
                          checkNumber: "",
                          checkBank: "",
                          checkDocument: "",
                        }
                      : {}),
                  })
                }
              />
            </div>

            <div className="mt-6">
              <PatientFinancialReceivePaymentFields
                values={values}
                disabled={isDisabled}
                cashRegisters={cashRegisters}
                onChange={patchValues}
              />
            </div>
          </div>
        </div>

        <SheetFooter
          className={cn(
            CLINIC_SHEET_FOOTER_CLASS,
            viewMode && onAttachReceipt && "justify-between",
          )}
        >
          {viewMode && onAttachReceipt ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setIsAttaching(true);
                  void Promise.resolve(onAttachReceipt(file)).finally(() =>
                    setIsAttaching(false),
                  );
                }}
              />
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                disabled={isAttaching}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" aria-hidden />
                Anexar comprovante
              </Button>
            </>
          ) : null}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              disabled={isPending || isAttaching}
              onClick={handleClose}
            >
              {viewMode ? "Fechar" : "Cancelar"}
            </Button>
            {!viewMode ? (
              <Button
                type="button"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                disabled={isPending}
                onClick={() => void handleSave()}
              >
                Salvar
              </Button>
            ) : null}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
