import type { PosTerminal } from '../../../../domain/entities/pos-terminal.entity';
import type { ListPosTerminalsResult } from '../../../../application/dtos/pos-terminal.dto';

export class PosTerminalPresenter {
  static toHttpDetail(
    posTerminal: PosTerminal,
    names?: { organizationName?: string | null; branchName?: string | null },
  ) {
    return {
      id: posTerminal.id,
      branchId: posTerminal.branchId,
      name: posTerminal.name,
      status: posTerminal.status,
      printer: posTerminal.printer,
      scale: posTerminal.scale,
      nfceContingency: posTerminal.nfceContingency,
      offlineServerId: posTerminal.offlineServerId,
      // O código em si nunca sai daqui — só na resposta de `POST .../pair`,
      // que é o único momento em que ele precisa ser lido por um humano.
      hasPairingCode:
        posTerminal.pairingCode !== null &&
        (posTerminal.pairingCodeExpiresAt?.getTime() ?? 0) > Date.now(),
      // Estado do pareamento. O **hash nunca sai** — o que o backoffice
      // precisa é saber se há dispositivo, qual, e quando deu sinal.
      paired: posTerminal.isPaired,
      pairedAt: posTerminal.pairedAt?.toISOString() ?? null,
      pairedDeviceLabel: posTerminal.pairedDeviceLabel,
      lastSeenAt: posTerminal.lastSeenAt?.toISOString() ?? null,
      // `null` = herda o padrão da loja. A tela precisa da distinção para
      // desenhar "Usar o padrão da loja" ligado — derivar comparando mapas
      // seria adivinhação.
      moduleOverrides: posTerminal.moduleOverrides,
      deletedAt: posTerminal.deletedAt?.toISOString() ?? null,
      createdAt: posTerminal.createdAt.toISOString(),
      updatedAt: posTerminal.updatedAt.toISOString(),
      ...(names
        ? {
            organizationName: names.organizationName ?? null,
            branchName: names.branchName ?? null,
          }
        : {}),
    };
  }

  static toHttpSingle(
    posTerminal: PosTerminal,
    names?: { organizationName?: string | null; branchName?: string | null },
  ) {
    return { data: this.toHttpDetail(posTerminal, names) };
  }

  static toHttpList(result: ListPosTerminalsResult) {
    return {
      data: result.items.map((item) => this.toHttpDetail(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Resposta do `redeem` — **o único lugar** em que o `deviceToken` aparece em
   * claro. Os dados do terminal vêm junto para o PDV não precisar de uma
   * segunda chamada só para descobrir de que loja e unidade ele é.
   */
  static toHttpPairedDevice(result: {
    deviceToken: string;
    terminal: PosTerminal;
    organizationName: string | null;
    branchName: string | null;
  }) {
    return {
      data: {
        deviceToken: result.deviceToken,
        terminal: {
          id: result.terminal.id,
          name: result.terminal.name,
          organizationId: result.terminal.organizationId,
          branchId: result.terminal.branchId,
          organizationName: result.organizationName,
          branchName: result.branchName,
        },
      },
    };
  }

  static toHttpPairingCode(result: { code: string; expiresAt: Date }) {
    return {
      data: { code: result.code, expiresAt: result.expiresAt.toISOString() },
    };
  }
}
