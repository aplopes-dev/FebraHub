import type {
  PosTerminal,
  PosTerminalStatusValue,
} from '../../domain/entities/pos-terminal.entity';

export type CreatePosTerminalDto = {
  organizationId: string;
  branchId: string;
  name: string;
  status?: PosTerminalStatusValue;
  printer?: string | null;
  scale?: string | null;
  nfceContingency?: boolean;
  offlineServerId?: string | null;
};

/** PATCH: campo ausente não muda — ver `UpdatePosTerminalInput` na entidade. */
export type UpdatePosTerminalDto = {
  organizationId: string;
  id: string;
  name?: string;
  branchId?: string;
  status?: PosTerminalStatusValue;
  printer?: string | null;
  scale?: string | null;
  nfceContingency?: boolean;
  offlineServerId?: string | null;
};

export type ListPosTerminalsDto = {
  organizationId: string;
  search?: string;
  status?: PosTerminalStatusValue;
  /** Recorte por acesso do membro — vem do `TenantContext`, não da query. */
  allowedBranchIds?: string[] | null;
  page?: number;
  perPage?: number;
};

export type ListPosTerminalsResult = {
  items: PosTerminal[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FindPosTerminalByIdDto = { organizationId: string; id: string };
export type DeletePosTerminalDto = { organizationId: string; id: string };
export type GeneratePairingCodeDto = { organizationId: string; id: string };

export type RedeemPairingCodeDto = {
  code: string;
  /** Como o dispositivo se apresenta ("Windows · Caixa da frente"). */
  deviceLabel?: string | null;
};

/**
 * O `deviceToken` sai **em claro só aqui**, uma vez. O banco guarda o hash.
 * Os dados do terminal vêm junto para o PDV não precisar de uma segunda
 * chamada só para saber em que loja e unidade ele foi parear.
 */
export type RedeemPairingCodeResult = {
  deviceToken: string;
  terminal: PosTerminal;
  /** Nome da empresa (tradeName ?? legalName) para o PDV exibir na app bar. */
  organizationName: string | null;
  /** Nome da unidade (tradeName ?? legalName). */
  branchName: string | null;
};

export type RevokeDeviceDto = { organizationId: string; id: string };
export type GeneratePairingCodeResult = {
  id: string;
  code: string;
  expiresAt: Date;
};
