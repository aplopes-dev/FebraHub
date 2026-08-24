"use client";

import { useState } from "react";
import {
  Copy,
  CheckSquare,
  RotateCcw,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import type { Invoice } from "../../types";

interface ReceivablesActionsMenuProps {
  invoice: Invoice;
}

export function ReceivablesActionsMenu({ invoice }: ReceivablesActionsMenuProps) {
  const [confirmBaixa, setConfirmBaixa] = useState(false);
  const [confirmEstorno, setConfirmEstorno] = useState(false);

  function handleCopyLink() {
    const link = invoice.invoiceUrl;
    if(link) navigator.clipboard.writeText(link).catch(() => null);
  }

  function handleBaixaManual() {
    console.log("Baixa manual:", invoice.id);
    setConfirmBaixa(false);
  }

  function handleEstorno() {
    console.log("Estornar/Cancelar:", invoice.id);
    setConfirmEstorno(false);
  }

  function handleViewPdf() {
    const url = invoice.invoiceUrl ?? `https://pdf.asaas.com/i/${invoice.id}`;
    window.open(url, "_blank");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações de {invoice.id}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Link de Pagamento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmBaixa(true)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Forçar Baixa Manual
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmEstorno(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Estornar / Cancelar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewPdf}>
            <FileText className="mr-2 h-4 w-4" />
            Visualizar PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmBaixa}
        onOpenChange={setConfirmBaixa}
        title="Confirmar baixa manual?"
        description={
          <>
            A fatura <strong>{invoice.id}</strong> será marcada como paga
            manualmente. Use esta opção apenas quando o pagamento foi confirmado
            fora do sistema (ex: TED direto).
          </>
        }
        confirmLabel="Confirmar Baixa"
        cancelLabel="Cancelar"
        onConfirm={handleBaixaManual}
      />

      <ConfirmDialog
        open={confirmEstorno}
        onOpenChange={setConfirmEstorno}
        title="Estornar / Cancelar fatura?"
        description={
          <>
            A fatura <strong>{invoice.id}</strong> será cancelada ou estornada.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Estornar"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={handleEstorno}
      />
    </>
  );
}
