import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_CLINIC_STRAND,
  parseClinicStrand,
  type ClinicStrand,
  type StorePlatformEventData,
} from '@citybox/messaging';
import { Clinic } from '../../domain/entities/clinic.entity';
import { Organization } from '../../domain/entities/organization.entity';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../../domain/repositories/tenancy.repositories';

function clinicStrandFromEvent(event: StorePlatformEventData): ClinicStrand {
  const parsed = parseClinicStrand(event.clinicStrand);
  if (parsed === null || parsed === undefined) {
    return DEFAULT_CLINIC_STRAND;
  }
  return parsed;
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/**
 * Materializa/atualiza `Organization` + `Clinic` raiz a partir de um evento do platform.
 *
 * Idempotente por natureza: reexecutar com o mesmo evento não duplica nada — a
 * organização é encontrada por `storeId` e a clínica raiz por `id = storeId`.
 * Isso é essencial porque a entrega é at-least-once.
 */
@Injectable()
export class SyncOrganizationFromEventUseCase {
  private readonly logger = new Logger(SyncOrganizationFromEventUseCase.name);

  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly clinics: ClinicRepository,
  ) {}

  async execute(event: StorePlatformEventData): Promise<Organization> {
    const existing = await this.organizations.findByStoreId(event.storeId);

    const planSnapshot = event.plan
      ? {
          planId: event.plan.planId,
          tier: event.plan.tier,
          maxClinics: event.plan.maxNegocios,
          maxUsers: event.plan.maxUsers,
        }
      : null;

    // `status` chega no evento desde a Fase 2 — respeitá-lo cobre o replay de um evento
    // de loja que já nasceu bloqueada, e não só o fluxo feliz.
    const suspended = event.status === 'BLOCKED';

    if (existing) {
      if (planSnapshot) {
        const clinicCount = await this.clinics.countActiveByOrganizationId(
          existing.id,
        );
        existing.applyPlan(planSnapshot, clinicCount);
      }
      if (suspended) existing.suspend(event.reason ?? null);
      else existing.reactivate();
      existing.props.name = event.tradeName;
      existing.props.platformUpdatedAt = new Date(event.updatedAt);
      existing.props.syncedAt = new Date();
      return this.organizations.save(existing);
    }

    const organization = Organization.create({
      storeId: event.storeId,
      name: event.tradeName,
      status: suspended ? 'suspended' : 'active',
      clinicStrand: clinicStrandFromEvent(event),
      plan: planSnapshot ?? {
        planId: null,
        tier: null,
        maxClinics: null,
        maxUsers: null,
      },
      overQuota: false,
      suspendedReason: suspended ? (event.reason ?? null) : null,
      platformUpdatedAt: new Date(event.updatedAt),
      syncedAt: new Date(),
    });
    const saved = await this.organizations.save(organization);

    // Clínica raiz com id = storeId — a manobra que mantém as 49 tabelas legadas válidas.
    const existingRoot = await this.clinics.findById(event.storeId);
    if (!existingRoot) {
      await this.clinics.save(
        Clinic.create(
          {
            organizationId: saved.id,
            name: event.tradeName,
            slug: slugify(event.slug || event.tradeName, event.storeId),
            isRoot: true,
            status: 'active',
            legalName: event.legalName ?? null,
            document: event.document ?? null,
            stateRegistration: event.stateRegistration ?? null,
            zipCode: event.address?.zipCode ?? null,
            street: event.address?.street ?? null,
            number: event.address?.number ?? null,
            complement: event.address?.complement ?? null,
            neighborhood: event.address?.neighborhood ?? null,
            city: event.address?.city ?? null,
            state: event.address?.state ?? null,
            phone: event.phone ?? null,
            timezone: event.timezone,
          },
          event.storeId,
        ),
      );
      this.logger.log(
        `Organização ${saved.id} + clínica raiz ${event.storeId} criadas`,
      );
    }

    return saved;
  }

  /** `store.plan_changed` — atualiza só o snapshot, sem tocar em status. */
  async applyPlanChange(event: StorePlatformEventData): Promise<void> {
    const organization = await this.organizations.findByStoreId(event.storeId);
    if (!organization || !event.plan) return;

    const clinicCount = await this.clinics.countActiveByOrganizationId(
      organization.id,
    );
    organization.applyPlan(
      {
        planId: event.plan.planId,
        tier: event.plan.tier,
        maxClinics: event.plan.maxNegocios,
        maxUsers: event.plan.maxUsers,
      },
      clinicCount,
    );
    await this.organizations.save(organization);

    if (organization.overQuota) {
      this.logger.warn(
        `Organização ${organization.id} acima da quota após downgrade (${clinicCount} clínicas > ${event.plan.maxNegocios}). Criação bloqueada; nada foi apagado.`,
      );
    }
  }

  async setSuspended(
    storeId: string,
    suspended: boolean,
    reason?: string | null,
  ): Promise<void> {
    const organization = await this.organizations.findByStoreId(storeId);
    if (!organization) return;
    if (suspended) organization.suspend(reason ?? null);
    else organization.reactivate();
    await this.organizations.save(organization);
  }

  /** Lookup usado pelo consumidor em `store.updated` para não criar org via evento. */
  findByStoreId(storeId: string): Promise<Organization | null> {
    return this.organizations.findByStoreId(storeId);
  }
}
