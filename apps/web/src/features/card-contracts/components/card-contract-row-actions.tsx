"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { useRouter } from "next/navigation";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { CardContract } from "@/features/card-contracts/types/card-contract";

type CardContractRowActionsProps = {
  contract: CardContract;
  onDelete: (contract: CardContract) => void | Promise<void>;
  onRestore: (contract: CardContract) => void | Promise<void>;
};

export function CardContractRowActions({
  contract,
  onDelete,
  onRestore,
}: CardContractRowActionsProps) {
  const router = useRouter();
  const isDeleted = contract.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${contract.provider}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(contract),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${contract.provider}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () =>
            router.push(
              `/financas/contratos-de-cartoes-e-outros/${contract.id}`,
            ),
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          dividerBefore: true,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir contrato?",
        description: (
          <>
            Tem certeza que deseja excluir o contrato da{" "}
            <span style={{ fontWeight: 600 }}>{contract.provider}</span>? Ele
            ficará disponível na aba Excluídos.
          </>
        ),
        onConfirm: () => onDelete(contract),
      }}
    />
  );
}
