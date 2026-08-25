/**
 * Chave de acesso da NF-e (44 dígitos) + dígito verificador (módulo 11) —
 * algoritmo público do Manual de Orientação do Contribuinte (MOC) da NF-e.
 * Composição: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + série(3) + nNF(9) +
 * tpEmis(1) + cNF(8) + cDV(1) = 44 dígitos.
 *
 * Portado de @citybox/fiscal-api (nfe-access-key.ts). Funções puras, sem deps.
 */
export type BuildAccessKeyInput = {
  /** Código IBGE da UF do emitente (2 dígitos) — ex.: "29" para Bahia. */
  cUF: string;
  emissionDate: Date;
  cnpj: string;
  /** Modelo do documento — "55" para NF-e, "65" para NFC-e. */
  mod: string;
  series: string;
  number: string;
  /** Tipo de emissão — "1" normal; contingência é evolução futura. */
  tpEmis: string;
  /** Código numérico aleatório (8 dígitos) — gerado pelo chamador. */
  cNF: string;
};

export type BuiltAccessKey = {
  /** 44 dígitos, sem o prefixo "NFe" (usado cru em campos como chNFe). */
  accessKey: string;
  cDV: string;
};

function calculateModulo11CheckDigit(digits: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  let weightIndex = 0;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    sum += Number(digits[i]) * weights[weightIndex % weights.length];
    weightIndex += 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
}

export function buildNfeAccessKey(input: BuildAccessKeyInput): BuiltAccessKey {
  const aamm =
    String(input.emissionDate.getFullYear()).slice(-2) +
    String(input.emissionDate.getMonth() + 1).padStart(2, '0');

  const first43 = [
    input.cUF.padStart(2, '0'),
    aamm,
    input.cnpj.padStart(14, '0'),
    input.mod.padStart(2, '0'),
    input.series.padStart(3, '0'),
    input.number.padStart(9, '0'),
    input.tpEmis,
    input.cNF.padStart(8, '0'),
  ].join('');

  const cDV = calculateModulo11CheckDigit(first43);

  return { accessKey: first43 + cDV, cDV };
}
