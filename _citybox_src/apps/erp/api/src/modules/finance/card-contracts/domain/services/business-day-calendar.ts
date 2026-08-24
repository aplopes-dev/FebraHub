/**
 * Calendário de dias úteis do motor de recebíveis do contrato de cartões
 * (`specs/erp/005-card-receivables-engine/`). Função pura — sem Prisma, sem
 * NestJS, sem I/O.
 *
 * Limitação conhecida e documentada (spec, seção Assumptions): dia útil
 * considera só segunda a sexta — não há tabela de feriados nacionais/
 * municipais nesta entrega.
 */
export type DayCountType = 'business_days' | 'calendar_days';

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Soma `days` a partir de `from`. Em `calendar_days`, soma corrida simples.
 * Em `business_days`, avança dia a dia pulando sábado/domingo — cada dia útil
 * encontrado conta como uma unidade de `days`. `days=0` devolve `from`
 * inalterada (não empurra para o próximo dia útil — ver `pushToNextBusinessDay`
 * para esse comportamento separado).
 */
export function addDays(from: Date, days: number, type: DayCountType): Date {
  const result = new Date(from);

  if (type === 'calendar_days') {
    result.setDate(result.getDate() + days);
    return result;
  }

  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
}

/**
 * Empurra `date` para a próxima segunda-feira se cair em sábado/domingo —
 * usado quando o contrato tem `businessDaysOnly` habilitado (FR-011). Datas
 * que já caem em dia útil voltam inalteradas.
 */
export function pushToNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}
