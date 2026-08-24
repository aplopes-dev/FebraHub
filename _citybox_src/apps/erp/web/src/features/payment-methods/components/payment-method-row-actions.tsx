"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { RowActionsMenu } from "@/components/ui/list-page";
import type { PaymentMethod } from "@/features/payment-methods/types/payment-method";

export type PaymentMethodRowActionsProps = {
  method: PaymentMethod;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void | Promise<void>;
};

/** Menu ⋯ das formas criadas pela empresa (as da plataforma não têm menu). */
export function PaymentMethodRowActions({
  method,
  onEdit,
  onDelete,
}: PaymentMethodRowActionsProps) {
  return (
    <RowActionsMenu
      ariaLabel={`Ações da forma de pagamento ${method.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(method),
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
        },
      ]}
      confirmDelete={{
        title: "Excluir forma de pagamento",
        description: `A forma de pagamento "${method.name}" deixará de ficar disponível no seu negócio.`,
        onConfirm: () => onDelete(method),
      }}
    />
  );
}
