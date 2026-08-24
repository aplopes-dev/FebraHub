import { ClinicStore } from '../../domain/entities/clinic-store.entity';
import type { StorePlatformEventData } from '../dtos/store-platform-event.dto';

export function mapEventToClinicStoreProps(
  event: StorePlatformEventData,
  syncedAt: Date = new Date(),
): Parameters<typeof ClinicStore.create>[0] {
  const address = event.address ?? {};
  return {
    storeId: event.storeId,
    tradeName: event.tradeName.trim(),
    legalName: event.legalName?.trim() || null,
    slug: event.slug.trim(),
    vertical: event.vertical,
    document: event.document?.trim() || null,
    stateRegistration: event.stateRegistration?.trim() || null,
    // A plataforma parou de mandar este campo na Fase 10 (não há mais Cliente, logo o
    // documento é sempre o da própria loja). A coluna segue no `ClinicStore`, que será
    // aposentado em favor da `Organization`; até lá grava `false`.
    usesClientDocument: event.usesClientDocument ?? false,
    zipCode: address.zipCode?.trim() || null,
    street: address.street?.trim() || null,
    number: address.number?.trim() || null,
    complement: address.complement?.trim() || null,
    neighborhood: address.neighborhood?.trim() || null,
    city: address.city?.trim() || null,
    state: address.state?.trim() || null,
    phone: event.phone?.trim() || null,
    timezone: event.timezone.trim(),
    platformUpdatedAt: new Date(event.updatedAt),
    syncedAt,
  };
}
