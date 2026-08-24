import type { ClinicStrand } from '@citybox/messaging';
import type { UpsertStoreDto } from '../dtos/store.dto';
import type {
  StoreProps,
  StoreVertical,
} from '../../domain/entities/store.entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { onlyDigits } from '../../../../shared/core/utils/brazilian-document.utils';
import { resolveStoreClinicStrand } from './resolve-store-clinic-strand';

export function normalizeStoreSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function normalizeStoreDocument(document?: string): string | null {
  if (!document?.trim()) return null;
  return onlyDigits(document);
}

export type CreateStorePropsInput = Optional<
  StoreProps,
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'deploymentStatus'
  | 'document'
  | 'legalName'
  | 'stateRegistration'
  | 'zipCode'
  | 'street'
  | 'streetNumber'
  | 'complement'
  | 'neighborhood'
  | 'city'
  | 'state'
  | 'phone'
  | 'lastSeenAt'
  | 'ordersToday'
  | 'ordersThisMonth'
  | 'revenueTodayCents'
  | 'averageTicketCents'
  | 'averageAcceptTimeSeconds'
  | 'lastOrderAt'
  | 'lastAccessAt'
  | 'maintenanceMode'
  | 'visibleInApp'
  | 'trialEndsAt'
  | 'sefazHomologacao'
  | 'contingenciaOffline'
  | 'gatewayCustomerId'
  | 'clinicStrand'
>;

export function mapUpsertDtoToStoreProps(
  dto: UpsertStoreDto & {
    vertical: string;
    clinicStrand?: string | null;
  },
  context = 'StoreMapper',
): CreateStorePropsInput {
  const address = dto.address ?? {};

  const tradeName = dto.tradeName.trim();
  // PF sem razão social: o ERP exige legalName no evento — fallback no nome fantasia.
  const legalName =
    dto.legalName?.trim() ||
    (dto.personType === 'PF' ? tradeName : null) ||
    null;

  return {
    vertical: dto.vertical as StoreVertical,
    clinicStrand: resolveStoreClinicStrand(
      dto.vertical,
      dto.clinicStrand,
      context,
    ),
    tradeName,
    slug: normalizeStoreSlug(dto.slug),
    // Sem `usesClientDocument`: o documento é sempre o da própria loja (Fase 10).
    document: normalizeStoreDocument(dto.document),
    personType: dto.personType ?? null,
    responsibleName: dto.responsibleName?.trim() || null,
    billingEmail: dto.billingEmail?.trim() || null,
    legalName,
    stateRegistration: dto.stateRegistration?.trim() || null,
    zipCode: address.zipCode?.trim() || null,
    street: address.street?.trim() || null,
    streetNumber: address.number?.trim() || null,
    complement: address.complement?.trim() || null,
    neighborhood: address.neighborhood?.trim() || null,
    city: address.city?.trim() || null,
    state: address.state?.trim() || null,
    phone: dto.phone?.trim() || null,
    timezone: dto.timezone.trim(),
  };
}

export function toStoreProps(
  input: CreateStorePropsInput,
  overrides: Pick<StoreProps, 'status' | 'createdAt' | 'updatedAt'>,
): StoreProps {
  return {
    vertical: input.vertical,
    clinicStrand:
      input.clinicStrand ??
      (input.vertical === 'Clínica' ? 'odontologia' : null),
    tradeName: input.tradeName,
    slug: input.slug,
    document: input.document ?? null,
    gatewayCustomerId: input.gatewayCustomerId ?? null,
    personType: input.personType ?? null,
    responsibleName: input.responsibleName ?? null,
    billingEmail: input.billingEmail ?? null,
    deploymentStatus: input.deploymentStatus ?? 'PENDING',
    legalName: input.legalName ?? null,
    stateRegistration: input.stateRegistration ?? null,
    zipCode: input.zipCode ?? null,
    street: input.street ?? null,
    streetNumber: input.streetNumber ?? null,
    complement: input.complement ?? null,
    neighborhood: input.neighborhood ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    phone: input.phone ?? null,
    timezone: input.timezone,
    lastSeenAt: input.lastSeenAt ?? null,
    ordersToday: input.ordersToday ?? 0,
    ordersThisMonth: input.ordersThisMonth ?? 0,
    revenueTodayCents: input.revenueTodayCents ?? 0,
    averageTicketCents: input.averageTicketCents ?? 0,
    averageAcceptTimeSeconds: input.averageAcceptTimeSeconds ?? 0,
    lastOrderAt: input.lastOrderAt ?? null,
    lastAccessAt: input.lastAccessAt ?? null,
    maintenanceMode: input.maintenanceMode ?? false,
    visibleInApp: input.visibleInApp ?? false,
    trialEndsAt: input.trialEndsAt ?? null,
    sefazHomologacao: input.sefazHomologacao ?? false,
    contingenciaOffline: input.contingenciaOffline ?? false,
    ...overrides,
  };
}
