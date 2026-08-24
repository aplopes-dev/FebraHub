"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ActiveStatusBadge } from "@/components/ui/status/active-status-badge";
import { PosRegisterRowActions } from "@/features/pos-registers/components/pos-register-row-actions";
import type { PosRegister } from "@/features/pos-registers/types/pos-register";

type PosRegisterListTableProps = {
  posRegisters: PosRegister[];
  page: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (posRegister: PosRegister) => void;
  onToggleStatus: (posRegister: PosRegister) => void;
  onGeneratePairingCode: (posRegister: PosRegister) => void;
  onRevokeDevice: (posRegister: PosRegister) => void | Promise<void>;
  onDelete: (posRegister: PosRegister) => void | Promise<void>;
};

function deviceLabel(value: string | null): string {
  return value?.trim() ? value : "—";
}

/** "há 3 min", "há 2 h", "há 4 d" — o que interessa é a ordem de grandeza. */
function formatLastSeen(iso: string | null): string {
  if (!iso) return "sem sinal";
  const elapsedMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

export function PosRegisterListTable({
  posRegisters,
  page,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  onGeneratePairingCode,
  onRevokeDevice,
  onDelete,
}: PosRegisterListTableProps) {
  const columns = useMemo<DataTableColumn<PosRegister>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (item) => (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>
        ),
      },
      {
        id: "printer",
        header: "Impressora",
        render: (item) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {deviceLabel(item.printer)}
          </Typography>
        ),
      },
      {
        id: "scale",
        header: "Balança",
        render: (item) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {deviceLabel(item.scale)}
          </Typography>
        ),
      },
      {
        id: "device",
        header: "Dispositivo",
        render: (item) =>
          item.paired ? (
            <Stack spacing={0.25}>
              <Typography variant="body2" noWrap>
                {deviceLabel(item.pairedDeviceLabel)}
              </Typography>
              {/* Sinal de vida: é o que responde "o Caixa 2 está ligado?"
                  sem ninguém precisar ir até a loja. */}
              <Tooltip
                title={
                  item.lastSeenAt
                    ? new Date(item.lastSeenAt).toLocaleString("pt-BR")
                    : "Nunca deu sinal"
                }
              >
                <Typography variant="caption" color="text.secondary" noWrap>
                  {formatLastSeen(item.lastSeenAt)}
                </Typography>
              </Tooltip>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" noWrap>
              Não pareado
            </Typography>
          ),
      },
      {
        id: "status",
        header: "Status",
        width: 120,
        render: (item) => (
          <ActiveStatusBadge active={item.status === "active"} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (item) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PosRegisterRowActions
              posRegister={item}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onGeneratePairingCode={onGeneratePairingCode}
              onRevokeDevice={onRevokeDevice}
              onDelete={onDelete}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onToggleStatus, onGeneratePairingCode, onRevokeDevice, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      rows={posRegisters}
      getRowId={(item) => item.id}
      isLoading={isLoading}
      emptyMessage="Nenhum ponto de venda encontrado."
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
