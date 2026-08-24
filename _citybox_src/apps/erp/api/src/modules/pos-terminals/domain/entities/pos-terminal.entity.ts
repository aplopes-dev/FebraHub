import { Entity } from '../../../../shared/core/entity';
import { PosTerminalValidatorFactory } from '../factories/pos-terminal-validator.factory';

export const POS_TERMINAL_STATUSES = ['active', 'inactive'] as const;
export type PosTerminalStatusValue = (typeof POS_TERMINAL_STATUSES)[number];

export type PosTerminalProps = {
  organizationId: string;
  branchId: string;
  name: string;
  status: PosTerminalStatusValue;
  printer: string | null;
  scale: string | null;
  nfceContingency: boolean;
  offlineServerId: string | null;
  /** `null` até a primeira geração de `POST .../pair` — ver `setPairingCode`. */
  pairingCode: string | null;
  pairingCodeExpiresAt: Date | null;
  /** SHA-256 do device token — ver `DeviceToken`. `null` = não pareado. */
  deviceTokenHash: string | null;
  pairedAt: Date | null;
  pairedDeviceLabel: string | null;
  lastSeenAt: Date | null;
  /**
   * Sobrescrita de módulos **deste** terminal. `null` = herda o padrão da
   * organização, e continua herdando quando ele mudar.
   *
   * Só os opcionais entram — ver `resolveTerminalModules` em `pos-modules`.
   */
  moduleOverrides: Record<string, string> | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePosTerminalProps = {
  organizationId: string;
  branchId: string;
  name: string;
  status?: PosTerminalStatusValue;
  printer?: string | null;
  scale?: string | null;
  nfceContingency?: boolean;
  offlineServerId?: string | null;
};

/**
 * Entrada de `update()` — semântica **PATCH**: um campo ausente (`undefined`)
 * não muda; `null` explícito limpa (só vale para os campos nullable). Diferente
 * de `Customer`/`Branch`, que são PUT (campo omitido é limpo).
 */
export type UpdatePosTerminalInput = {
  name?: string;
  branchId?: string;
  status?: PosTerminalStatusValue;
  printer?: string | null;
  scale?: string | null;
  nfceContingency?: boolean;
  offlineServerId?: string | null;
};

function normalizeName(name: string): string {
  return name.trim();
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  return value?.trim() || null;
}

/**
 * Terminal de PDV cadastrado por uma unidade — o dispositivo físico
 * (desktop/tablet) que vai se identificar contra a erp-api. Primeiro módulo
 * da integração PDV↔ERP; o pareamento real (troca de código por credencial de
 * longa duração) é fatia futura — aqui só nasce e gera o código opaco.
 */
export class PosTerminal extends Entity<PosTerminalProps> {
  constructor(props: PosTerminalProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PosTerminalValidatorFactory.create().validate(this);
  }

  public static create(
    props: CreatePosTerminalProps,
    id?: string,
  ): PosTerminal {
    const now = new Date();
    return new PosTerminal(
      {
        organizationId: props.organizationId,
        branchId: props.branchId,
        name: normalizeName(props.name),
        status: props.status ?? 'active',
        printer: normalizeOptionalText(props.printer),
        scale: normalizeOptionalText(props.scale),
        nfceContingency: props.nfceContingency ?? false,
        offlineServerId: normalizeOptionalText(props.offlineServerId),
        pairingCode: null,
        pairingCodeExpiresAt: null,
        deviceTokenHash: null,
        pairedAt: null,
        pairedDeviceLabel: null,
        lastSeenAt: null,
        // Terminal novo **herda** o padrão da loja. Copiar o conjunto no
        // momento da criação o congelaria: mudar o padrão depois não chegaria
        // nos caixas já cadastrados, que é o oposto do que "padrão" significa.
        moduleOverrides: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(props: PosTerminalProps, id: string): PosTerminal {
    return new PosTerminal(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get branchId() {
    return this.props.branchId;
  }
  get name() {
    return this.props.name;
  }
  get status() {
    return this.props.status;
  }
  get printer() {
    return this.props.printer;
  }
  get scale() {
    return this.props.scale;
  }
  get nfceContingency() {
    return this.props.nfceContingency;
  }
  get offlineServerId() {
    return this.props.offlineServerId;
  }
  get pairingCode() {
    return this.props.pairingCode;
  }
  get pairingCodeExpiresAt() {
    return this.props.pairingCodeExpiresAt;
  }
  get deviceTokenHash() {
    return this.props.deviceTokenHash;
  }
  get pairedAt() {
    return this.props.pairedAt;
  }
  get pairedDeviceLabel() {
    return this.props.pairedDeviceLabel;
  }
  get lastSeenAt() {
    return this.props.lastSeenAt;
  }

  get moduleOverrides() {
    return this.props.moduleOverrides;
  }

  /**
   * Define — ou remove — a sobrescrita de módulos.
   *
   * `null` faz o terminal voltar a **herdar**, e a distinção importa: um `{}`
   * o congelaria no conjunto atual da loja, sem acompanhar mudanças futuras, e
   * ninguém veria a diferença até o padrão mudar.
   */
  setModuleOverrides(overrides: Record<string, string> | null): PosTerminal {
    return PosTerminal.with(
      { ...this.props, moduleOverrides: overrides, updatedAt: new Date() },
      this.id,
    );
  }

  get isPaired() {
    return this.props.deviceTokenHash !== null;
  }

  get isOperational() {
    return this.props.deletedAt === null && this.props.status === 'active';
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /** PATCH: só os campos presentes em `input` mudam. */
  update(input: UpdatePosTerminalInput): PosTerminal {
    return PosTerminal.with(
      {
        ...this.props,
        name:
          input.name !== undefined
            ? normalizeName(input.name)
            : this.props.name,
        branchId:
          input.branchId !== undefined ? input.branchId : this.props.branchId,
        status: input.status !== undefined ? input.status : this.props.status,
        printer:
          input.printer !== undefined
            ? normalizeOptionalText(input.printer)
            : this.props.printer,
        scale:
          input.scale !== undefined
            ? normalizeOptionalText(input.scale)
            : this.props.scale,
        nfceContingency:
          input.nfceContingency !== undefined
            ? input.nfceContingency
            : this.props.nfceContingency,
        offlineServerId:
          input.offlineServerId !== undefined
            ? normalizeOptionalText(input.offlineServerId)
            : this.props.offlineServerId,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  softDelete(): PosTerminal {
    const now = new Date();
    return PosTerminal.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  /**
   * O código confere e ainda vale?
   *
   * Mora na entidade, e não no use case, porque "válido" é a conjunção de três
   * coisas do próprio terminal — ter código, bater, não ter expirado — e
   * espalhar isso pelo use case convidaria a esquecer uma delas.
   */
  isPairingCodeValid(code: string, now: Date = new Date()): boolean {
    const stored = this.props.pairingCode;
    const expiresAt = this.props.pairingCodeExpiresAt;
    if (stored === null || expiresAt === null) return false;
    if (stored !== code.trim().toUpperCase()) return false;
    return expiresAt.getTime() > now.getTime();
  }

  /**
   * Consome o código e passa a valer a credencial do dispositivo.
   *
   * **Limpa `pairingCode`** — é isto que torna o código de uso único. Sem
   * limpar, o mesmo código pareado num tablet serviria para parear outro
   * dentro da janela de 15 minutos.
   *
   * Parear de novo sobrescreve o token anterior: o dispositivo velho perde o
   * acesso na chamada seguinte, que é o comportamento certo para reinstalação.
   */
  pairDevice(deviceTokenHash: string, deviceLabel: string | null): PosTerminal {
    const now = new Date();
    return PosTerminal.with(
      {
        ...this.props,
        pairingCode: null,
        pairingCodeExpiresAt: null,
        deviceTokenHash,
        pairedAt: now,
        pairedDeviceLabel: normalizeOptionalText(deviceLabel),
        lastSeenAt: now,
        updatedAt: now,
      },
      this.id,
    );
  }

  /** Terminal perdido/roubado: a credencial morre, o cadastro fica. */
  revokeDevice(): PosTerminal {
    return PosTerminal.with(
      {
        ...this.props,
        deviceTokenHash: null,
        pairedAt: null,
        pairedDeviceLabel: null,
        lastSeenAt: null,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Marca atividade do dispositivo. **Não mexe em `updatedAt`** de propósito:
   * é telemetria, não edição do cadastro — senão a coluna "atualizado em" da
   * listagem viraria um relógio.
   */
  touchLastSeen(at: Date = new Date()): PosTerminal {
    return PosTerminal.with({ ...this.props, lastSeenAt: at }, this.id);
  }

  /** Sobrescreve o código anterior, se houver — não é cumulativo. */
  setPairingCode(code: string, expiresAt: Date): PosTerminal {
    return PosTerminal.with(
      {
        ...this.props,
        pairingCode: code,
        pairingCodeExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
