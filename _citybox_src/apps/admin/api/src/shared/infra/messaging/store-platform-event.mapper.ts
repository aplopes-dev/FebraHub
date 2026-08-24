import type {
  StorePlatformEventData,
  StorePlatformEventOwnerData,
  StorePlatformEventPlanData,
  StorePlatformEventStatus,
} from '@citybox/messaging';
import type { Store } from '../../../modules/stores/domain/entities/store.entity';
import type { Plan } from '../../../modules/plans/domain/entities/plan.entity';

// O contrato vive em `packages/messaging` (fonte única compartilhada com as verticais).
// Reexportado aqui para não quebrar os imports existentes deste app.
export type {
  StorePlatformEventData,
  StorePlatformEventOwnerData,
  StorePlatformEventPlanData,
  StorePlatformEventStatus,
};

export type MapStoreEventOptions = {
  /** Motivo da suspensão — só faz sentido em `store.suspended`. */
  reason?: string | null;
};

/**
 * `plan` só é incluído quando o chamador tem o Plan em mãos (criação de loja e troca de
 * plano — FR-007/FR-008). O dono (`owner`) vem sempre da própria Store, que absorveu os
 * campos do antigo Client. `status` acompanha todo evento desde a Fase 2, para que a
 * vertical saiba o estado comercial mesmo em replay de um evento antigo.
 */
export function mapStoreToPlatformEvent(
  store: Store,
  plan?: Plan,
  options?: MapStoreEventOptions,
): StorePlatformEventData {
  return {
    storeId: store.id,
    vertical: store.vertical,
    ...(store.clinicStrand ? { clinicStrand: store.clinicStrand } : {}),
    tradeName: store.tradeName,
    slug: store.slug,
    legalName: store.legalName,
    document: store.document,
    stateRegistration: store.stateRegistration,
    phone: store.phone,
    timezone: store.timezone,
    address: {
      zipCode: store.zipCode,
      street: store.street,
      number: store.streetNumber,
      complement: store.complement,
      neighborhood: store.neighborhood,
      city: store.city,
      state: store.state,
    },
    owner: {
      personType: store.personType,
      responsibleName: store.responsibleName,
      billingEmail: store.billingEmail,
    },
    plan: plan
      ? {
          planId: plan.id,
          vertical: plan.vertical,
          tier: plan.tier,
          maxNegocios: plan.maxNegocios,
          maxUsers: plan.maxUsers,
        }
      : undefined,
    status: store.status,
    reason: options?.reason ?? undefined,
    updatedAt: store.updatedAt.toISOString(),
  };
}
