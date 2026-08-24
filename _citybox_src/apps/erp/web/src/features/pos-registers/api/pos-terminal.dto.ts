/**
 * Shape do contrato da `erp-api` (`/v1/pos-terminals`) — não usar direto na UI.
 * O tipo de domínio do front (`types/pos-register.ts`) diverge em dois pontos,
 * traduzidos em `pos-terminal.mapper.ts`: NFC-e em contingência (`boolean` ×
 * `"enabled"`/`"disabled"`) e ausência de `branchId` (a unidade ativa do
 * cabeçalho decide, não um campo do formulário).
 */
export type PosTerminalStatusDto = "active" | "inactive";

export type PosTerminalDto = {
  id: string;
  branchId: string;
  name: string;
  status: PosTerminalStatusDto;
  printer: string | null;
  scale: string | null;
  nfceContingency: boolean;
  offlineServerId: string | null;
  hasPairingCode: boolean;
  /** Há dispositivo pareado. O hash da credencial nunca sai da API. */
  paired: boolean;
  pairedAt: string | null;
  pairedDeviceLabel: string | null;
  lastSeenAt: string | null;
  moduleOverrides: Record<string, string> | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PosTerminalListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PosTerminalListResponseDto = {
  data: PosTerminalDto[];
  meta: PosTerminalListMetaDto;
};

export type PosTerminalResponseDto = {
  data: PosTerminalDto;
};

export type PairingCodeResponseDto = {
  data: { code: string; expiresAt: string };
};

/** Corpo de `POST` — todos os campos obrigatórios exceto os opcionais nativos. */
export type CreatePosTerminalPayload = {
  branchId: string;
  name: string;
  status?: PosTerminalStatusDto;
  printer?: string;
  scale?: string;
  nfceContingency?: boolean;
  offlineServerId?: string;
};

/**
 * Corpo de `PATCH` — semântica PATCH real: chave ausente não muda o campo;
 * `null` explícito limpa (`printer`/`scale`/`offlineServerId`).
 */
export type UpdatePosTerminalPayload = {
  branchId?: string;
  name?: string;
  status?: PosTerminalStatusDto;
  printer?: string | null;
  scale?: string | null;
  nfceContingency?: boolean;
  offlineServerId?: string | null;
};
