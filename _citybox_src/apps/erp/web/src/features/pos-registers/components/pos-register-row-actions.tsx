"use client";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { PosRegister } from "@/features/pos-registers/types/pos-register";

type PosRegisterRowActionsProps = {
  posRegister: PosRegister;
  onEdit: (posRegister: PosRegister) => void;
  onToggleStatus: (posRegister: PosRegister) => void;
  onGeneratePairingCode: (posRegister: PosRegister) => void;
  onRevokeDevice: (posRegister: PosRegister) => void | Promise<void>;
  onDelete: (posRegister: PosRegister) => void | Promise<void>;
};

export function PosRegisterRowActions({
  posRegister,
  onEdit,
  onToggleStatus,
  onGeneratePairingCode,
  onRevokeDevice,
  onDelete,
}: PosRegisterRowActionsProps) {
  const isActive = posRegister.status === "active";

  const items = [
    {
      id: "edit",
      label: "Editar",
      icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
      onClick: () => onEdit(posRegister),
    },
    {
      id: "pair",
      label: "Gerar código de pareamento",
      icon: <KeyOutlinedIcon sx={{ fontSize: 16 }} />,
      onClick: () => onGeneratePairingCode(posRegister),
    },
    // Só aparece com dispositivo pareado: item de menu que não faz nada é
    // ruído no momento em que alguém está com pressa.
    ...(posRegister.paired
      ? [
          {
            id: "revoke-device",
            label: "Revogar dispositivo",
            icon: <LinkOffOutlinedIcon sx={{ fontSize: 16 }} />,
            onClick: () => void onRevokeDevice(posRegister),
          },
        ]
      : []),
    {
      id: "toggle-status",
      label: isActive ? "Marcar como inativo" : "Marcar como ativo",
      icon: isActive ? (
        <BlockOutlinedIcon sx={{ fontSize: 16 }} />
      ) : (
        <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
      ),
      onClick: () => onToggleStatus(posRegister),
    },
    {
      id: "delete",
      label: "Excluir",
      icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
      destructive: true,
      dividerBefore: true,
      onClick: () => {},
    },
  ];

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${posRegister.name}`}
      items={items}
      confirmDelete={{
        title: "Excluir ponto de venda?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{posRegister.name}</span>? Esta
            ação remove o PDV da listagem.
          </>
        ),
        onConfirm: () => onDelete(posRegister),
      }}
    />
  );
}
