import type {
  CardContractDto,
  CardPaymentMethodDto,
  SaveCardContractPayload,
  SaveCardPaymentMethodPayload,
} from "@/features/card-contracts/api/card-contract.dto";
import type {
  CardContract,
  CardContractFormValues,
  PaymentMethod,
  ProgressiveRateTier,
} from "@/features/card-contracts/types/card-contract";

function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

function centsToReais(cents: number): number {
  return cents / 100;
}

export function toCardContract(dto: CardContractDto): CardContract {
  return {
    id: dto.id,
    provider: dto.provider,
    bankAccountId: dto.bankAccountId,
    description: dto.description,
    paymentMethodCount: dto.paymentMethodCount,
    grouping: dto.grouping,
    cutoffPeriod: dto.cutoffPeriod,
    firstPaymentDayType: dto.firstPaymentDayType,
    installmentDayType: dto.installmentDayType,
    businessDaysOnly: dto.businessDaysOnly,
    depositFeeCents: dto.depositFeeCents,
    anticipationPeriods: dto.anticipationPeriods,
    anticipationRate: dto.anticipationRate,
    allEntriesPaidInContract: dto.allEntriesPaidInContract,
    businessDaysDeposit: dto.businessDaysDeposit,
    active: dto.active,
    deletedAt: dto.deletedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/**
 * PUT destrutivo: sempre monta o corpo completo a partir do form.
 * Campo omitido no servidor volta ao default.
 */
export function toSaveCardContractPayload(
  values: CardContractFormValues,
): SaveCardContractPayload {
  return {
    provider: values.provider.trim(),
    bankAccountId: values.bankAccountId.trim()
      ? values.bankAccountId.trim()
      : null,
    description: values.description.trim(),
    grouping: values.grouping,
    cutoffPeriod: values.cutoffPeriod,
    firstPaymentDayType: values.firstPaymentDayType,
    installmentDayType: values.installmentDayType,
    businessDaysOnly: values.businessDaysOnly,
    depositFeeCents: reaisToCents(values.depositFee),
    anticipationPeriods: values.anticipationPeriods,
    anticipationRate: values.anticipationRate,
    allEntriesPaidInContract: values.allEntriesPaidInContract,
    businessDaysDeposit: values.businessDaysDeposit,
    active: values.active,
  };
}

export function cardContractToFormValues(
  contract: CardContract,
): CardContractFormValues {
  return {
    provider: contract.provider,
    bankAccountId: contract.bankAccountId ?? "",
    description: contract.description,
    grouping: contract.grouping,
    cutoffPeriod: contract.cutoffPeriod,
    firstPaymentDayType: contract.firstPaymentDayType,
    installmentDayType: contract.installmentDayType,
    businessDaysOnly: contract.businessDaysOnly,
    depositFee: centsToReais(contract.depositFeeCents),
    anticipationPeriods: contract.anticipationPeriods,
    anticipationRate: contract.anticipationRate,
    allEntriesPaidInContract: contract.allEntriesPaidInContract,
    businessDaysDeposit: contract.businessDaysDeposit,
    active: contract.active,
  };
}

export function createEmptyCardContractFormValues(): CardContractFormValues {
  return {
    provider: "",
    bankAccountId: "",
    description: "",
    grouping: "by_payment_method",
    cutoffPeriod: "daily",
    firstPaymentDayType: "business_days",
    installmentDayType: "business_days",
    businessDaysOnly: false,
    depositFee: 0,
    anticipationPeriods: 0,
    anticipationRate: 0,
    allEntriesPaidInContract: false,
    businessDaysDeposit: true,
    active: true,
  };
}

export function toPaymentMethod(dto: CardPaymentMethodDto): PaymentMethod {
  return {
    id: dto.id,
    type: dto.type,
    brand: dto.brand,
    rate: dto.rate,
    fee: dto.feeCents != null ? centsToReais(dto.feeCents) : null,
    settlementDays: dto.settlementDays,
    minInstallments: dto.minInstallments,
    maxInstallments: dto.maxInstallments,
    firstPaymentDays: dto.firstPaymentDays,
    daysBetweenInstallments: dto.daysBetweenInstallments,
    progressiveEnabled: dto.progressiveEnabled,
    progressiveTiers: dto.progressiveTiers.map((tier) => ({
      id: tier.id,
      minInstallments: tier.minInstallments,
      maxInstallments: tier.maxInstallments,
      rate: tier.rate,
    })),
  };
}

/**
 * Monta o payload de payment-method. Campos irrelevantes ao tipo são
 * omitidos (viram null no servidor). Só envia `id` de faixa quando for UUID
 * válido — IDs locais inválidos fazem o ValidationPipe devolver 422.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toTierPayload(tier: ProgressiveRateTier): {
  id?: string;
  minInstallments: number;
  maxInstallments: number;
  rate: number;
} {
  const base = {
    minInstallments: tier.minInstallments,
    maxInstallments: tier.maxInstallments,
    rate: tier.rate,
  };
  return UUID_RE.test(tier.id) ? { ...base, id: tier.id } : base;
}

export function toSavePaymentMethodPayload(
  method: Omit<PaymentMethod, "id"> & { id?: string },
): SaveCardPaymentMethodPayload {
  const payload: SaveCardPaymentMethodPayload = {
    type: method.type,
    progressiveEnabled: method.progressiveEnabled ?? false,
  };

  if (method.type !== "pix") {
    payload.brand = method.brand?.trim() || null;
  } else {
    payload.brand = null;
  }

  payload.rate = method.rate ?? null;

  if (method.type !== "credit") {
    payload.feeCents =
      method.fee != null ? reaisToCents(method.fee) : null;
    payload.settlementDays = method.settlementDays ?? null;
    payload.minInstallments = null;
    payload.maxInstallments = null;
    payload.firstPaymentDays = null;
    payload.daysBetweenInstallments = null;
    payload.progressiveTiers = [];
    payload.progressiveEnabled = false;
  } else {
    payload.feeCents = null;
    payload.settlementDays = null;
    payload.minInstallments = method.minInstallments ?? null;
    payload.maxInstallments = method.maxInstallments ?? null;
    payload.firstPaymentDays = method.firstPaymentDays ?? null;
    payload.daysBetweenInstallments = method.daysBetweenInstallments ?? null;
    payload.progressiveEnabled = method.progressiveEnabled ?? false;
    if (payload.progressiveEnabled) {
      payload.progressiveTiers = (method.progressiveTiers ?? []).map(
        toTierPayload,
      );
    } else {
      payload.progressiveTiers = [];
    }
  }

  return payload;
}
