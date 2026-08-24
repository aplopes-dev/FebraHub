import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CardSettlementRateUnresolvedError } from '../errors/card-settlement-rate-unresolved.error';
import {
  addDays,
  pushToNextBusinessDay,
  type DayCountType,
} from './business-day-calendar';

/**
 * Motor de recebíveis do contrato de cartões
 * (`specs/erp/005-card-receivables-engine/`) — coração da feature. Função
 * pura: sem Prisma, sem NestJS, sem I/O. Resolve a taxa efetiva (faixa
 * progressiva ou taxa base), calcula o valor líquido e a data de cada
 * parcela, respeitando dias úteis/corridos e pagamento único.
 */

export type CardSettlementRateTierSnapshot = {
  minInstallments: number;
  maxInstallments: number;
  rate: string;
};

export type CardSettlementMethodSnapshot = {
  /** Decimal(9,4) serializado (ex.: "2.3"). `null` quando só o progressivo cobre. */
  rate: string | null;
  feeCents: number | null;
  /** Já resolvido pelo chamador: `firstPaymentDays` do método, com fallback
   * para `settlementDays` quando ausente (ver `resolve-card-settlement`). */
  firstPaymentDays: number | null;
  daysBetweenInstallments: number | null;
  progressiveEnabled: boolean;
  rateTiers: CardSettlementRateTierSnapshot[];
};

export type CardSettlementContractSnapshot = {
  firstPaymentDayType: DayCountType;
  installmentDayType: DayCountType | 'single_payment';
  businessDaysOnly: boolean;
};

export type CardSettlementInput = {
  grossAmountCents: number;
  saleDate: Date;
  /** 1 para débito/Pix; número de parcelas para crédito. */
  installments: number;
  method: CardSettlementMethodSnapshot;
  contract: CardSettlementContractSnapshot;
};

export type CardSettlementInstallment = {
  /** 1-based; `1` mesmo quando há só 1 parcela (pagamento único, débito, Pix). */
  sequence: number;
  dueDate: Date;
  grossAmountCents: number;
  feeAmountCents: number;
  netAmountCents: number;
};

function validateInstallments(installments: number): void {
  if (!Number.isInteger(installments) || installments < 1) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid card settlement installments: ${installments}`,
      externalMessage: 'O número de parcelas deve ser maior ou igual a 1.',
      context: 'calculateCardSettlement',
    });
  }
}

/**
 * Faixa progressiva cuja abrangência contempla `installments`, senão a taxa
 * base do método. Sem nenhuma das duas, sinaliza para o chamador tratar como
 * "sem correspondência" (research.md D7).
 */
function resolveEffectiveRate(
  method: CardSettlementMethodSnapshot,
  installments: number,
): string {
  if (method.progressiveEnabled) {
    const tier = method.rateTiers.find(
      (candidate) =>
        installments >= candidate.minInstallments &&
        installments <= candidate.maxInstallments,
    );
    if (tier) return tier.rate;
  }

  if (method.rate != null) return method.rate;

  throw new CardSettlementRateUnresolvedError(installments);
}

/** Divide `totalCents` em `count` partes iguais por `Math.floor`; o resto
 * inteiro (não distribuído) vai inteiro para a última parcela — mesma
 * convenção de `sales-contracts.service.ts` (research.md D8). */
function splitWithRemainderOnLast(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? base + remainder : base,
  );
}

function resolveDueDate(
  from: Date,
  days: number,
  dayType: DayCountType,
  businessDaysOnly: boolean,
): Date {
  const date = addDays(from, days, dayType);
  return businessDaysOnly ? pushToNextBusinessDay(date) : date;
}

export function calculateCardSettlement(
  input: CardSettlementInput,
): CardSettlementInstallment[] {
  validateInstallments(input.installments);

  const rate = resolveEffectiveRate(input.method, input.installments);
  const percentageFeeCents = Math.round(
    input.grossAmountCents * (Number(rate) / 100),
  );
  const totalFeeCents = percentageFeeCents + (input.method.feeCents ?? 0);

  const firstDueDate = resolveDueDate(
    input.saleDate,
    input.method.firstPaymentDays ?? 0,
    input.contract.firstPaymentDayType,
    input.contract.businessDaysOnly,
  );

  const installmentDayType = input.contract.installmentDayType;

  if (installmentDayType === 'single_payment') {
    return [
      {
        sequence: 1,
        dueDate: firstDueDate,
        grossAmountCents: input.grossAmountCents,
        feeAmountCents: totalFeeCents,
        netAmountCents: input.grossAmountCents - totalFeeCents,
      },
    ];
  }

  const count = input.installments;
  const daysBetween = input.method.daysBetweenInstallments ?? 0;
  const grossSplit = splitWithRemainderOnLast(input.grossAmountCents, count);
  const feeSplit = splitWithRemainderOnLast(totalFeeCents, count);

  const result: CardSettlementInstallment[] = [];
  let dueDate = firstDueDate;
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      dueDate = resolveDueDate(
        dueDate,
        daysBetween,
        installmentDayType,
        input.contract.businessDaysOnly,
      );
    }
    const grossAmountCents = grossSplit[index];
    const feeAmountCents = feeSplit[index];
    result.push({
      sequence: index + 1,
      dueDate,
      grossAmountCents,
      feeAmountCents,
      netAmountCents: grossAmountCents - feeAmountCents,
    });
  }
  return result;
}
