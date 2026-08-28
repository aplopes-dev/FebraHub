/** Fuso padrão da unidade. */
export const DEFAULT_TIMEZONE = "America/Bahia";

/** Endereço da unidade — campos vazios viram `""` no formulário. */
export type UnitAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const EMPTY_UNIT_ADDRESS: UnitAddress = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};
