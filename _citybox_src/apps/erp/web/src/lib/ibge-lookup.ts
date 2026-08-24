/**
 * Resolução do código IBGE (7 dígitos) do município a partir de (cidade, UF).
 *
 * Por quê uma tabela estática (research.md D1 de `fiscal-certificate`, spec
 * erp/010): o cadastro de filial **não** tem o código IBGE (só cidade e UF,
 * texto livre), e o lookup de CEP existente (BrasilAPI v1) **não** devolve o
 * código. Um campo novo na filial seria uma migration — fora da única
 * alteração de backend autorizada naquela entrega. A plataforma é
 * single-city Ilhéus; a tabela cobre Ilhéus e municípios da região. Par não
 * encontrado → `null`, e quem chama trata como dado faltante (nunca chuta um
 * código).
 *
 * Movido de `features/fiscal-certificate/lib/` para cá (spec erp/028): o
 * endereço do cliente (`Customer.addresses[]`) tem a mesma lacuna — cidade+UF
 * texto livre, sem código IBGE — e a NF-e precisa desse código em
 * `enderDest.cMun`. Geografia genérica, não algo do domínio de certificado —
 * reuso, não duplicação.
 *
 * Fonte definitiva futura: um campo `cityCodeIbge` na filial/endereço.
 */

/** Normaliza nome de cidade para comparação: minúsculas, sem acento, sem espaços extras. */
export function normalizeCityName(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove marcas de acentuação (combining marks)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Chave `uf:cidadeNormalizada` → código IBGE (7 dígitos). */
const CITY_IBGE_TABLE: Record<string, string> = {
  // Bahia — região cacaueira / sul (single-city Ilhéus + vizinhas)
  "ba:ilheus": "2913606",
  "ba:itabuna": "2914802",
  "ba:una": "2932408",
  "ba:canavieiras": "2906808",
  "ba:urucuca": "2932705",
  "ba:itacare": "2914604",
  "ba:coaraci": "2908309",
  "ba:itajuipe": "2914653",
  "ba:buerarema": "2904506",
  "ba:aurelino leal": "2903508",
  "ba:salvador": "2927408",
  "ba:vitoria da conquista": "2933307",
  "ba:feira de santana": "2910800",
};

/**
 * Retorna o código IBGE de 7 dígitos para (cidade, UF), ou `null` se não estiver
 * na tabela — quem chama trata como dado faltante.
 */
export function resolveCityCodeIbge(
  city: string | null | undefined,
  uf: string | null | undefined,
): string | null {
  if (!city || !uf) return null;
  const key = `${uf.trim().toLowerCase()}:${normalizeCityName(city)}`;
  return CITY_IBGE_TABLE[key] ?? null;
}
