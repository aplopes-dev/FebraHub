"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { Branch } from "@/features/branches/types/branch";

type BranchRowActionsProps = {
  branch: Branch;
  onDelete: (branch: Branch) => void | Promise<void>;
};

export function BranchRowActions({ branch, onDelete }: BranchRowActionsProps) {
  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${branch.displayName}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          href: `/configuracoes/unidades-filiais/${branch.id}`,
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          dividerBefore: true,
          // A matriz é o âncora fiscal da organização — não pode ser desativada.
          disabled: branch.isHeadquarters,
          disabledCaption: branch.isHeadquarters
            ? "A matriz não pode ser excluída"
            : undefined,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir unidade?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{branch.displayName}</span>? Ela sai
            das listagens, mas as notas e movimentos já emitidos continuam
            apontando para ela.
          </>
        ),
        onConfirm: () => onDelete(branch),
      }}
    />
  );
}
