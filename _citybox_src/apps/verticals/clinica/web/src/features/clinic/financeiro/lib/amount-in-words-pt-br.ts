/** Converte valor em BRL para extenso (reais e centavos). */
const UNITS = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const TENS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function belowHundred(n: number): string {
  if (n < 20) return UNITS[n] ?? "";
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return TENS[ten] ?? "";
  return `${TENS[ten]} e ${UNITS[unit]}`;
}

function belowThousand(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  if (n < 100) return belowHundred(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const head = HUNDREDS[hundred] ?? "";
  if (rest === 0) return head;
  return `${head} e ${belowHundred(rest)}`;
}

function integerPart(n: number): string {
  if (n === 0) return "zero";

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    parts.push(
      millions === 1
        ? "um milhão"
        : `${belowThousand(millions)} milhões`,
    );
  }

  if (thousands > 0) {
    parts.push(
      thousands === 1 ? "mil" : `${belowThousand(thousands)} mil`,
    );
  }

  if (rest > 0) {
    parts.push(belowThousand(rest));
  }

  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
}

/**
 * Ex.: 32250 → "trinta e dois mil e duzentos e cinquenta reais"
 */
export function amountInWordsPtBr(amount: number): string {
  const safe = Math.max(0, Math.round(amount * 100) / 100);
  const reais = Math.floor(safe);
  const cents = Math.round((safe - reais) * 100);

  const reaisLabel =
    reais === 1 ? "real" : "reais";
  const centsLabel = cents === 1 ? "centavo" : "centavos";

  const reaisText = `${integerPart(reais)} ${reaisLabel}`;
  if (cents === 0) return reaisText;
  return `${reaisText} e ${integerPart(cents)} ${centsLabel}`;
}
