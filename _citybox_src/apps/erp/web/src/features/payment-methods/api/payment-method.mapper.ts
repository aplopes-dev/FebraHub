import type {
  PaymentMethodDto,
  SavePaymentMethodPayload,
} from "@/features/payment-methods/api/payment-method.dto";
import type {
  PaymentMethod,
  PaymentMethodFormValues,
  PaymentMethodGroups,
} from "@/features/payment-methods/types/payment-method";

export function toPaymentMethod(dto: PaymentMethodDto): PaymentMethod {
  return {
    id: dto.id,
    name: dto.name,
    fiscalCode: dto.fiscalCode,
    installmentPermission:
      dto.installmentPermission as PaymentMethod["installmentPermission"],
    isSystem: dto.isSystem,
    systemKey: dto.systemKey,
    deletedAt: dto.deletedAt,
  };
}

export function toSavePaymentMethodPayload(
  values: PaymentMethodFormValues,
): SavePaymentMethodPayload {
  return {
    name: values.name.trim(),
    fiscalCode: values.fiscalCode,
    installmentPermission: values.installmentPermission,
  };
}

/**
 * Separa a lista (já só ativas, vinda da API) nas duas listas da tela.
 * As da plataforma mantêm a ordem do backend (catálogo); as da empresa vão
 * por nome — mesma função pura que existia no store mock, só a fonte mudou.
 */
export function selectPaymentMethodGroups(
  items: PaymentMethod[],
): PaymentMethodGroups {
  return {
    system: items.filter((item) => item.isSystem),
    custom: items
      .filter((item) => !item.isSystem)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  };
}
