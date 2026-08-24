'use client';

import { Eye, Pencil, Printer, Trash2 } from 'lucide-react';
import { Button, Card, CardFooter, CardHeader } from '@citybox/ui/atoms';
import { formatPatientContractIssuedLabel } from '../../../../lib/format-patient-contract-issued';
import type { PatientContractEmissionRecord } from '../../../../types/patient-contract-emission';
import { PatientContractSignatureBadge } from './contract-signature-badge';

type PatientContractHistoryCardProps = {
  contract: PatientContractEmissionRecord;
  onView: (contract: PatientContractEmissionRecord) => void;
  onEdit: (contract: PatientContractEmissionRecord) => void;
  onPrint: (contract: PatientContractEmissionRecord) => void;
  onDelete: (contract: PatientContractEmissionRecord) => void;
  isPrinting?: boolean;
};

export function PatientContractHistoryCard({
  contract,
  onView,
  onEdit,
  onPrint,
  onDelete,
  isPrinting = false,
}: PatientContractHistoryCardProps) {
  return (
    <Card className="gap-0 border-border/60 py-0 shadow-sm">
      <CardHeader className="gap-0 space-y-0.5 pb-2 pt-3">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 font-medium text-foreground">{contract.templateName}</p>
          <PatientContractSignatureBadge contract={contract} />
        </div>

        <p className="text-[12px] leading-snug text-muted-foreground">
          {formatPatientContractIssuedLabel(contract.issuedAt, contract.issuedVia ?? 'manual')}
        </p>
      </CardHeader>

      <CardFooter className="gap-2 border-t-0 pb-3 pt-0">
        <Button type="button" className="h-10 min-w-0 flex-1" onClick={() => onView(contract)}>
          <Eye className="mr-2 size-4 shrink-0" aria-hidden />
          Ver contrato
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Editar contrato"
          onClick={() => onEdit(contract)}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Imprimir contrato"
          disabled={isPrinting}
          onClick={() => onPrint(contract)}
        >
          <Printer className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:text-destructive"
          aria-label="Excluir contrato"
          onClick={() => onDelete(contract)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );
}
