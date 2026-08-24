import type {
  PosTerminal,
  PosTerminalStatusValue,
} from '../entities/pos-terminal.entity';

export type PosTerminalListCriteria = {
  search?: string;
  status?: PosTerminalStatusValue;
  /** Recorte extra por acesso do membro — `null` significa "todas". */
  allowedBranchIds?: string[] | null;
  skip?: number;
  take?: number;
};

export abstract class PosTerminalRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PosTerminal | null>;
  abstract findAll(
    organizationId: string,
    criteria?: PosTerminalListCriteria,
  ): Promise<PosTerminal[]>;
  abstract count(
    organizationId: string,
    criteria?: PosTerminalListCriteria,
  ): Promise<number>;
  abstract save(posTerminal: PosTerminal): Promise<PosTerminal>;

  /**
   * Busca pelo código de pareamento, **sem organização** — quem chama é a rota
   * pública `redeem`, em que o dispositivo ainda não sabe de que loja é.
   */
  abstract findByPairingCode(code: string): Promise<PosTerminal | null>;

  /** Idem, para o `DeviceAuthGuard`: ele só tem o token. */
  abstract findByDeviceTokenHash(hash: string): Promise<PosTerminal | null>;

  /** Grava sem `TenantContext` — usado pelos dois caminhos acima. */
  abstract saveUnscoped(posTerminal: PosTerminal): Promise<PosTerminal>;
}
