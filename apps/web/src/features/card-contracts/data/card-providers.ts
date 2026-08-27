/**
 * Lista fechada de provedores para o campo `provider` do contrato de cartão
 * (spec `007-financeiro-ajustes-ui` US6, FR-013/FR-014/FR-015) — só estas 20
 * opções são selecionáveis, texto livre não é aceito. Antes era uma lista de
 * referência solta com `freeSolo` habilitado no `Autocomplete`.
 */
export const CARD_PROVIDER_SUGGESTIONS: string[] = [
  "Elavon",
  "Conductor",
  "Bin",
  "RV",
  "Firstdata Corban",
  "Fillip",
  "Libercard",
  "Cielo",
  "Rede",
  "Credsystem",
  "Infocards",
  "Nddcargo",
  "Global",
  "Vero",
  "Stone",
  "Mercado Pago",
  "Accentiv",
  "Alelo",
  "Aspeb",
  "A Vista",
];
