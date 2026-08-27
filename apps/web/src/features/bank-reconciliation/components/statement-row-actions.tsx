"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { BankStatementListItem } from "@/features/bank-reconciliation/types/bank-statement";

type StatementRowActionsProps = {
  statement: BankStatementListItem;
  onDelete: (statement: BankStatementListItem) => void | Promise<void>;
};

/**
 * Ações do extrato na listagem (FR-045). Hoje só "Excluir extrato".
 *
 * Excluir é **hard delete**: leva junto as transações e o arquivo OFX, e é isso
 * que libera as chaves de dedupe para o mesmo arquivo poder ser reimportado.
 * Bloqueado enquanto houver transação conciliada — o servidor também recusa
 * (422); desabilitar aqui evita abrir a confirmação para nada.
 */
export function StatementRowActions({
  statement,
  onDelete,
}: StatementRowActionsProps) {
  const hasReconciled = statement.counts.reconciled > 0;
  const label = statement.bankName || `Banco ${statement.bankCode}` || "extrato";

  return (
    <RowActionsMenu
      ariaLabel={`Ações do extrato ${label}`}
      items={[
        {
          id: "delete",
          label: "Excluir extrato",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          disabled: hasReconciled,
          disabledCaption: hasReconciled
            ? "Desfaça as conciliações deste extrato antes de excluí-lo"
            : undefined,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir extrato?",
        description: (
          <>
            O extrato, suas transações e o arquivo importado serão apagados
            definitivamente. Depois disso o mesmo arquivo pode ser importado de
            novo.
          </>
        ),
        onConfirm: () => onDelete(statement),
      }}
    />
  );
}
