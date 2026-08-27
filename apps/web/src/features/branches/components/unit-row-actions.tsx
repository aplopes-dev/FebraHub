"use client";

import { useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { ConfirmationDialog } from "@/ui";
import type { Branch } from "@/features/branches/types/branch";

type UnitRowActionsProps = {
  unit: Branch;
  onDelete: (id: string) => void | Promise<void>;
};

function editHref(unit: Branch): string {
  return unit.kind === "matrix"
    ? `/settings/units/matrices/${unit.id}`
    : `/settings/units/stores/${unit.id}`;
}

export function UnitRowActions({
  unit,
  onDelete,
}: UnitRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function handleConfirmDelete() {
    if (confirmLoading) return;
    setConfirmLoading(true);
    try {
      await onDelete(unit.id);
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <>
      <Stack
        direction="row"
        spacing={0.25}
        sx={{
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {unit.kind === "matrix" ? (
          <Tooltip title="Nova filial">
            <IconButton
              component={Link}
              href={`/settings/units/matrices/${unit.id}/stores/new`}
              size="small"
              aria-label={`Nova filial em ${unit.displayName}`}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title="Editar">
          <IconButton
            component={Link}
            href={editHref(unit)}
            size="small"
            aria-label={`Editar ${unit.displayName}`}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            type="button"
            size="small"
            color="error"
            aria-label={`Excluir ${unit.displayName}`}
            onClick={() => setConfirmOpen(true)}
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <ConfirmationDialog
        open={confirmOpen}
        loading={confirmLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          unit.kind === "matrix"
            ? "Excluir empresa matriz?"
            : "Excluir filial?"
        }
        description={
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{unit.displayName}</span>?
            {unit.kind === "matrix"
              ? " Só é possível desativar matrizes sem filiais ativas."
              : " Ela sai das listagens, mas o histórico fiscal permanece."}
          </>
        }
        confirmLabel="Excluir"
      />
    </>
  );
}
