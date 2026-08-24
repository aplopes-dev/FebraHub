"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useStore } from "@/lib/store-context";
import { clinicSettingsKeys } from "@/features/clinic/modules/settings/hooks/query-keys";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import type { EmitIncomeReceiptFormValues } from "../components/emit-income-receipt-dialog";
import {
  buildIncomeReceiptPdf,
  buildIncomeReceiptPdfFileName,
  nextReceiptNumber,
} from "../lib/build-income-receipt-pdf";
import { toPdfClinicInfo } from "../lib/to-pdf-clinic-info";
import type { FinancialEntry } from "../types";

/**
 * Fluxo compartilhado de “Emitir recibo” (Transações + Fluxo de caixa):
 * dialog → PDF client (`build-income-receipt-pdf`) → preview sheet.
 */
export function useEmitIncomeReceipt() {
  const { storeId } = useStore();
  const [entryToEmit, setEntryToEmit] = useState<FinancialEntry | null>(null);
  const [isEmitDialogOpen, setIsEmitDialogOpen] = useState(false);
  const [receiptPdfBlob, setReceiptPdfBlob] = useState<Blob | null>(null);
  const [receiptPdfFileName, setReceiptPdfFileName] = useState("recibo.pdf");
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);

  const { data: clinicProfile } = useQuery({
    queryKey: clinicSettingsKeys.profile(storeId ?? ""),
    queryFn: () => getClinicProfile(storeId!),
    enabled: Boolean(storeId),
  });

  const openEmitReceipt = (entry: FinancialEntry) => {
    setEntryToEmit(entry);
    setIsEmitDialogOpen(true);
  };

  const handleConfirmEmit = async (values: EmitIncomeReceiptFormValues) => {
    if (!entryToEmit) return;

    const clinic = toPdfClinicInfo(clinicProfile);
    const payeeName =
      values.recipient === "patient"
        ? (entryToEmit.patient?.name ?? entryToEmit.description)
        : values.otherName;
    const patientName =
      entryToEmit.patient?.name ?? entryToEmit.description;
    const receiptNumber = nextReceiptNumber(entryToEmit.id);
    const professionalName = clinic.responsible?.trim() || clinic.clinicName;
    const professionalEmail = clinic.email?.trim() || "";

    try {
      const blob = await buildIncomeReceiptPdf({
        clinic,
        professionalName,
        professionalEmail,
        receiptNumber,
        amount: entryToEmit.paidValue ?? entryToEmit.value,
        payeeName,
        patientName,
        payeeCpf: values.cpf,
        patientCpf: values.patientCpf,
        onBehalfOfOther: values.recipient === "other",
        city: clinicProfile?.city,
        copies: values.copies,
      });

      setReceiptPdfBlob(blob);
      setReceiptPdfFileName(
        buildIncomeReceiptPdfFileName({ payeeName, receiptNumber }),
      );
      setIsEmitDialogOpen(false);
      setIsReceiptPreviewOpen(true);
    } catch {
      toast.error("Não foi possível gerar o recibo");
    }
  };

  return {
    openEmitReceipt,
    emitDialog: {
      open: isEmitDialogOpen,
      onOpenChange: (open: boolean) => {
        setIsEmitDialogOpen(open);
        if (!open) setEntryToEmit(null);
      },
      entry: entryToEmit,
      onConfirm: (values: EmitIncomeReceiptFormValues) => {
        void handleConfirmEmit(values);
      },
    },
    previewSheet: {
      open: isReceiptPreviewOpen,
      onOpenChange: (open: boolean) => {
        setIsReceiptPreviewOpen(open);
        if (!open) {
          setReceiptPdfBlob(null);
          setEntryToEmit(null);
        }
      },
      title: "Preview do recibo" as const,
      fileName: receiptPdfFileName,
      pdfBlob: receiptPdfBlob,
    },
  };
}
