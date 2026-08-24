import type { ScopedTransactionClient } from '../../../../shared/infra/prisma/prisma.service';
import type {
  CardSettlementContractSnapshot,
  CardSettlementMethodSnapshot,
} from '../../../finance/card-contracts/domain/services/card-settlement-calculator';
import type { SaleOrderCardPaymentType } from '../../domain/entities/sale-order.entity';

/**
 * Resolução do contrato de cartão aplicável a um pagamento da venda
 * (`specs/erp/005-card-receivables-engine/`). `fallback` cobre tanto "sem
 * nenhum contrato para essa conta bancária" quanto "contrato existe, mas sem
 * método correspondente" — em ambos os casos o chamador aplica FR-005.
 */
export type CardSettlementResolution =
  | {
      kind: 'matched';
      cardContractId: string;
      cardPaymentMethodId: string;
      method: CardSettlementMethodSnapshot;
      contract: CardSettlementContractSnapshot;
    }
  | { kind: 'fallback' };

export type ResolveCardSettlementInput = {
  organizationId: string;
  bankAccountId: string | null;
  cardPaymentType: SaleOrderCardPaymentType;
  brand: string | null;
};

/**
 * Busca o contrato + método aplicável — Prisma direto na mesma transação de
 * fechamento da venda, sem injetar `FinanceModule` no `SalesModule`
 * (decisão registrada em `api/AGENTS.md` §9; research.md D1). Mesmo padrão
 * já usado por `maybeCreateReceivable` para resolver `ChartOfAccount`/
 * `CostCenter` por `systemKey`.
 *
 * Filtra `active=true` **e** `deletedAt=null` explicitamente — a listagem de
 * `card-contracts` só filtra por `deletedAt` (abas Ativos/Excluídos); um
 * contrato inativado mas não excluído não deve ser considerado aqui
 * (research.md D6). Mais de um contrato ativo compatível com a mesma conta
 * bancária + método é resolvido pelo mais antigo (`createdAt` asc),
 * deterministicamente.
 */
export async function resolveCardSettlement(
  tx: ScopedTransactionClient,
  input: ResolveCardSettlementInput,
): Promise<CardSettlementResolution> {
  if (!input.bankAccountId) return { kind: 'fallback' };

  const contracts = await tx.cardContract.findMany({
    where: {
      organizationId: input.organizationId,
      bankAccountId: input.bankAccountId,
      active: true,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    include: { paymentMethods: { include: { rateTiers: true } } },
  });

  for (const contract of contracts) {
    const method = contract.paymentMethods.find(
      (candidate) =>
        candidate.type === input.cardPaymentType &&
        candidate.brand === input.brand,
    );
    if (!method) continue;

    return {
      kind: 'matched',
      cardContractId: contract.id,
      cardPaymentMethodId: method.id,
      method: {
        rate: method.rate == null ? null : method.rate.toString(),
        feeCents: method.feeCents,
        firstPaymentDays: method.firstPaymentDays ?? method.settlementDays,
        daysBetweenInstallments: method.daysBetweenInstallments,
        progressiveEnabled: method.progressiveEnabled,
        rateTiers: method.rateTiers.map((tier) => ({
          minInstallments: tier.minInstallments,
          maxInstallments: tier.maxInstallments,
          rate: tier.rate.toString(),
        })),
      },
      contract: {
        firstPaymentDayType: contract.firstPaymentDayType,
        installmentDayType: contract.installmentDayType,
        businessDaysOnly: contract.businessDaysOnly,
      },
    };
  }

  return { kind: 'fallback' };
}
