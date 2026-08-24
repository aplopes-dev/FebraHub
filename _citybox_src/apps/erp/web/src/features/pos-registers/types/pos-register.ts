export type PosRegisterStatus = "active" | "inactive";

export type NfceContingency = "enabled" | "disabled";

export type PosRegister = {
  id: string;
  name: string;
  /** Rótulo do ponto de impressão (ex.: "EPSON TM-T20"). */
  printer: string | null;
  /** Rótulo da balança (ex.: "Toledo Prix"). */
  scale: string | null;
  status: PosRegisterStatus;
  /** NFC-e em contingência. */
  nfceContingency: NfceContingency;
  /** Servidor do aplicativo offline (id da opção mock). */
  offlineServerId: string | null;
  /** Há um aplicativo de PDV pareado com este terminal. */
  paired: boolean;
  pairedAt: string | null;
  /** Como o dispositivo se apresentou ("Windows · Caixa da frente"). */
  pairedDeviceLabel: string | null;
  /** Última chamada autenticada do dispositivo — sinal de vida. */
  lastSeenAt: string | null;
  /** Sobrescrita de módulos; `null` = herda o padrão da loja. */
  moduleOverrides: Record<string, string> | null;
  deletedAt: string | null;
};

export type PosRegisterFormValues = {
  name: string;
  /**
   * Sobrescrita de módulos. `null` = seguir o padrão da loja.
   *
   * Vive fora do PATCH do terminal porque tem rota própria
   * (`PUT /v1/pos-terminals/:id/modules`) — e precisa dela: no cadastro novo
   * o id só existe depois de salvar.
   */
  moduleOverrides: Record<string, string> | null;
  status: PosRegisterStatus;
  nfceContingency: NfceContingency;
  /** Id da opção de impressão; `""` = nenhum. */
  printerId: string;
  /** Id da opção de balança; `""` = nenhuma. */
  scaleId: string;
  /** Id do servidor offline; `""` = nenhum. */
  offlineServerId: string;
};

export type PosRegisterOption = {
  id: string;
  label: string;
};

export type PosRegisterListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type PosRegisterListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PosRegisterListResult = {
  data: PosRegister[];
  meta: PosRegisterListMeta;
};

export const POS_REGISTER_STATUS_LABELS: Record<PosRegisterStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const NFCE_CONTINGENCY_LABELS: Record<NfceContingency, string> = {
  enabled: "Habilitado",
  disabled: "Desabilitado",
};

export function createEmptyPosRegisterFormValues(): PosRegisterFormValues {
  return {
    name: "",
    moduleOverrides: null,
    status: "active",
    nfceContingency: "disabled",
    printerId: "",
    scaleId: "",
    offlineServerId: "",
  };
}
