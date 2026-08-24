"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import {
  canRemoveMovementCategory,
  type MovementCategoryListItem,
} from "@/features/movement-categories/types/movement-category";

type MovementCategoryRowActionsProps = {
  category: MovementCategoryListItem;
  onEdit: (category: MovementCategoryListItem) => void;
  onDelete: (category: MovementCategoryListItem) => void;
};

export function MovementCategoryRowActions({
  category,
  onEdit,
  onDelete,
}: MovementCategoryRowActionsProps) {
  const removability = canRemoveMovementCategory(category);

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${category.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(category),
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          disabled: !removability.removable,
          disabledCaption: removability.reason,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir categoria",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{category.name}</span>? Essa ação
            não pode ser desfeita.
          </>
        ),
        onConfirm: () => onDelete(category),
      }}
    />
  );
}
