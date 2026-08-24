// Opções de exigibilidade do ISS (`tribISSQN`) — spec erp/018.
// O XSD (TSTribISSQN) tem 4 valores; nesta fatia oferecemos os 3 que não exigem
// campo extra (1/2/4). 3 (exportação) aparece desabilitado com o motivo.

export type IssqnTribTypeOption = {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

export const ISSQN_TRIB_TYPE_OPTIONS: IssqnTribTypeOption[] = [
  { value: "1", label: "Exigível (operação tributável)" },
  { value: "2", label: "Imunidade" },
  { value: "4", label: "Não incidência" },
  {
    value: "3",
    label: "Exportação de serviço",
    disabled: true,
    disabledReason:
      "Exige dados adicionais de exportação na nota — disponível em uma entrega futura.",
  },
];

export const ISSQN_TRIB_TYPE_LABEL: Record<string, string> = {
  "1": "Exigível",
  "2": "Imunidade",
  "3": "Exportação",
  "4": "Não incidência",
};

/** Formato do código municipal LC 116 (NN.NN). */
export const ISSQN_SERVICE_CODE_RE = /^\d{2}\.\d{2}$/;
/** cTribNac: exatamente 6 dígitos. */
export const ISSQN_NATIONAL_CODE_RE = /^\d{6}$/;
