/**
 * Datas de fim de campanha (`statusType=period`) são dias civis enviados pelo ERP
 * como `yyyy-MM-dd` e persistidos via `new Date('yyyy-MM-dd')` (meia-noite UTC).
 *
 * Regra de produto: a campanha fica finalizada a partir de **00:00 BRT** do dia
 * da data fim (o dia da data fim já não é ativo).
 */

export type CivilYmd = { y: number; m: number; d: number };

/** Dia civil em America/Sao_Paulo (UTC−3, sem DST). */
export function brazilCivilYmd(now: Date): CivilYmd {
  // Converter instante UTC → wall-clock BRT: subtrair 3h e ler partes UTC.
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

/**
 * Dia civil da data fim: partes UTC do `Date` (alinha com `new Date('yyyy-MM-dd')`).
 */
export function endDateCivilYmd(endDate: Date): CivilYmd {
  return {
    y: endDate.getUTCFullYear(),
    m: endDate.getUTCMonth() + 1,
    d: endDate.getUTCDate(),
  };
}

function compareCivil(a: CivilYmd, b: CivilYmd): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

/**
 * `true` quando o instante `now` já está no dia civil BRT da data fim (ou depois).
 * Ex.: endDate = 17/07 → a partir de 00:00 BRT do dia 17, expirada.
 */
export function isCampaignPeriodExpired(
  endDate: Date,
  now: Date = new Date(),
): boolean {
  return compareCivil(brazilCivilYmd(now), endDateCivilYmd(endDate)) >= 0;
}
