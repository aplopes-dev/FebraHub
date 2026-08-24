import { Invoice } from '../../../invoices/domain/entities/invoice.entity';
import type { SubscriptionCycle } from '../../domain/entities/subscription.entity';

/**
 * Gera faturas antecipadas para uma assinatura.
 *
 * - MONTHLY: 12 faturas (uma para cada mês do ciclo)
 * - YEARLY: 1 fatura (ano inteiro, vencimento no próximo mês)
 *
 * Cada fatura tem seu próprio dueDate e período.
 */
export function generateUpfrontInvoices(params: {
  subscriptionId: string;
  storeId: string;
  priceCents: number;
  cycle: SubscriptionCycle;
  dayOfMonth: number;
  referenceDate: Date;
}): Invoice[] {
  const {
    subscriptionId,
    storeId,
    priceCents,
    cycle,
    dayOfMonth,
    referenceDate,
  } = params;

  if (cycle === 'YEARLY') {
    return generateYearlyInvoice({
      subscriptionId,
      storeId,
      priceCents,
      dayOfMonth,
      referenceDate,
    });
  }

  return generateMonthlyInvoices({
    subscriptionId,
    storeId,
    priceCents,
    dayOfMonth,
    referenceDate,
  });
}

/**
 * Gera uma única fatura manual para uma assinatura.
 * O vencimento é gerado para o próximo mês, no dia correspondente (dayOfMonth).
 */
export function generateManualInvoice(params: {
  subscriptionId: string;
  storeId: string;
  amountCents: number;
  periodStart: Date;
  periodEnd: Date;
  dayOfMonth: number;
  referenceDate: Date;
  notes?: string;
}): Invoice {
  const {
    subscriptionId,
    storeId,
    amountCents,
    periodStart,
    periodEnd,
    dayOfMonth,
    referenceDate,
    notes,
  } = params;

  const dueDate = calculateMonthDueDate(referenceDate, dayOfMonth, 0);

  return Invoice.create({
    subscriptionId,
    storeId,
    amountCents,
    currency: 'BRL',
    status: 'OPEN',
    dueDate,
    periodStart,
    periodEnd,
    notes,
  });
}

function generateMonthlyInvoices(params: {
  subscriptionId: string;
  storeId: string;
  priceCents: number;
  dayOfMonth: number;
  referenceDate: Date;
}): Invoice[] {
  const { subscriptionId, storeId, priceCents, dayOfMonth, referenceDate } =
    params;
  const invoices: Invoice[] = [];

  let periodStart = new Date(referenceDate);

  for (let i = 0; i < 12; i++) {
    const dueDate = calculateMonthDueDate(referenceDate, dayOfMonth, i);
    const periodEnd = new Date(dueDate);

    const invoice = Invoice.create({
      subscriptionId,
      storeId,
      amountCents: priceCents,
      currency: 'BRL',
      status: 'OPEN',
      dueDate,
      periodStart,
      periodEnd,
    });

    invoices.push(invoice);
    periodStart = new Date(periodEnd);
  }

  return invoices;
}

function generateYearlyInvoice(params: {
  subscriptionId: string;
  storeId: string;
  priceCents: number;
  dayOfMonth: number;
  referenceDate: Date;
}): Invoice[] {
  const { subscriptionId, storeId, priceCents, dayOfMonth, referenceDate } =
    params;

  // Vencimento no próximo mês (mesmo que mensal)
  const dueDate = calculateMonthDueDate(referenceDate, dayOfMonth, 0);

  // Período de 1 ano
  const periodEnd = new Date(referenceDate);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const invoice = Invoice.create({
    subscriptionId,
    storeId,
    amountCents: priceCents,
    currency: 'BRL',
    status: 'OPEN',
    dueDate,
    periodStart: referenceDate,
    periodEnd,
  });

  return [invoice];
}

/**
 * Calcula a data de vencimento para o mês N a partir da referência.
 *
 * Exemplos (referência = 14/jul/2026, dayOfMonth = 5):
 *   i=0 → 5/ago/2026
 *   i=1 → 5/set/2026
 *   i=11 → 5/jul/2027
 */
function calculateMonthDueDate(
  referenceDate: Date,
  dayOfMonth: number,
  monthOffset: number,
): Date {
  const due = new Date(referenceDate);

  // Avança para o primeiro vencimento (mês seguinte) + offset
  const targetMonth = due.getMonth() + 1 + monthOffset;
  const targetYear = due.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;

  const maxDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  due.setFullYear(targetYear, normalizedMonth, Math.min(dayOfMonth, maxDay));
  due.setHours(0, 0, 0, 0);

  return due;
}
