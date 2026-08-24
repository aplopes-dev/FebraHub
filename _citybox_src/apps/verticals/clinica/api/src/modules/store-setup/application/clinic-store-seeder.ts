import { Injectable, Logger, Optional } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../../shared/infra/keycloak/keycloak-provisioning.service';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';
import { ProvisionOrganizationOwnerUseCase } from '../../members/application/use-cases/provision-organization-owner.use-case';
import type { StorePlatformEventOwnerData } from './dtos/store-platform-event.dto';
import { seedClinicAnamnesis } from './seed-clinic-anamnesis';
import {
  resolveClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging';
import type { ClinicSeedPack } from './seed-data/packs/types';
import { resolveClinicSeedPackForStrand } from './seed-data/packs/resolve-clinic-seed-pack';
import { planNeedsStrandRepair } from './seed-data/plan-strand-repair';
import { resolveSeedSpecialtyLocationUiType } from './seed-data/specialty-location-ui-type';

const DEMO_APPOINTMENT_NOTES = 'Agendamento demonstração (seed da loja)';

/**
 * Aplica o template de first-contact da clínica (idempotente por nome/chave natural).
 *
 * Provisiona **apenas** o responsável (OWNER) no Keycloak + `clinica.members` —
 * sem equipe demo (Secretário/Gerente/Dentista/Fisioterapeuta). Demais membros
 * entram pela tela Equipe.
 */
@Injectable()
export class ClinicStoreSeeder {
  private readonly logger = new Logger(ClinicStoreSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisionOwner: ProvisionOrganizationOwnerUseCase,
    @Optional() private readonly keycloak?: KeycloakProvisioningService,
  ) {}

  async seed(
    storeId: string,
    owner?: StorePlatformEventOwnerData | null,
  ): Promise<void> {
    const { pack, strand } = await this.resolvePackContext(storeId);
    await this.ensureOwner(storeId, owner);
    await this.seedPlan(storeId, pack, strand);
    await seedClinicAnamnesis(this.prisma, storeId, pack);
    await this.seedContract(storeId, pack);
    await this.seedFinancial(storeId, pack);
    const patientCategoryId = await this.seedPatientCategories(storeId, pack);
    const demoAppointmentCategoryId = await this.seedAppointmentCategories(
      storeId,
      pack,
    );
    await this.seedDemoPatientAndAppointment(
      storeId,
      pack,
      patientCategoryId,
      demoAppointmentCategoryId,
    );
  }

  private async resolvePackContext(storeId: string): Promise<{
    pack: ClinicSeedPack;
    strand: ClinicStrand;
  }> {
    const organization = await this.prisma.organization.findUnique({
      where: { storeId },
      select: { clinicStrand: true },
    });
    const strand = resolveClinicStrand(organization?.clinicStrand);
    return {
      pack: resolveClinicSeedPackForStrand(strand),
      strand,
    };
  }

  /**
   * Responsável pela organização — criado **localmente** no Keycloak + `clinica.members`.
   *
   * A pessoa vem do evento (`owner.responsibleName` / `owner.billingEmail`). Sem equipe
   * demo: só este usuário nasce com a loja.
   *
   * Best-effort de propósito: falhar aqui não pode derrubar o provisionamento inteiro —
   * o operador cria a equipe pela tela, ou reexecuta via POST /v1/store-setup/:id/retry.
   *
   * Público para o retry poder chamar **mesmo quando o template de seed já foi aplicado**
   * (seed log versionado): um Keycloak 409 no first-contact deixava a loja “seedada”
   * sem OWNER, e o early-return do setup impedia qualquer segunda tentativa.
   */
  async ensureOwner(
    storeId: string,
    owner?: StorePlatformEventOwnerData | null,
  ): Promise<void> {
    if (process.env.CLINIC_SEED_DEMO_TEAM === 'false') return;
    if (!this.keycloak?.isConfigured()) {
      this.logger.warn(
        'Credencial clinica-provisioning não configurada — responsável não será criado (seed segue sem profissional)',
      );
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { storeId },
      select: { id: true, clinics: { where: { isRoot: true }, select: { id: true } } },
    });
    const rootClinic = organization?.clinics[0];
    if (!organization || !rootClinic) {
      this.logger.warn(
        `Organização/clínica raiz ausente para store ${storeId} — responsável ignorado`,
      );
      return;
    }

    try {
      await this.provisionOwner.execute({
        storeId,
        organizationId: organization.id,
        rootClinicId: rootClinic.id,
        responsibleName: owner?.responsibleName ?? null,
        billingEmail: owner?.billingEmail ?? null,
      });
    } catch (err) {
      this.logger.warn(
        `ensureOrganizationOwner falhou: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Corrige plano Particular seedado com pack da vertente errada (ex.: fisio com
   * especialidades odontológicas). Idempotente — só troca quando detecta mismatch.
   *
   * Público no retry (`POST /v1/store-setup/:id/retry`) para lojas criadas antes
   * do pack por vertente ou com `clinicStrand` corrigido depois do first-contact.
   */
  async ensurePlanMatchesPack(storeId: string): Promise<void> {
    const { pack, strand } = await this.resolvePackContext(storeId);
    await this.seedPlan(storeId, pack, strand);
  }

  private async seedPlan(
    storeId: string,
    pack: ClinicSeedPack,
    strand: ClinicStrand,
  ): Promise<void> {
    const existing = await this.prisma.clinicPlan.findFirst({
      where: { storeId, name: pack.plan.name },
      include: {
        specialties: {
          select: { name: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (existing) {
      if (existing.sortOrder < 1) {
        await this.prisma.clinicPlan.update({
          where: { id: existing.id },
          data: { sortOrder: 1, updatedAt: new Date() },
        });
      }

      const specialtyNames = existing.specialties.map((row) => row.name);
      if (planNeedsStrandRepair(specialtyNames, strand, pack)) {
        this.logger.warn(
          `Plano ${pack.plan.name} da store ${storeId} tem especialidades da vertente errada — reseed (${strand})`,
        );
        await this.replacePlanContents(existing.id, storeId, pack, strand);
      }
      return;
    }

    const now = new Date();
    const plan = await this.prisma.clinicPlan.create({
      data: {
        storeId,
        name: pack.plan.name,
        sortOrder: 1,
        status: 'active',
        isDefault: pack.plan.isDefault,
        updatedAt: now,
      },
    });

    await this.populatePlanSpecialties(plan.id, storeId, pack, strand, now);
  }

  private async replacePlanContents(
    planId: string,
    storeId: string,
    pack: ClinicSeedPack,
    strand: ClinicStrand,
  ): Promise<void> {
    await this.prisma.clinicPlanTreatment.deleteMany({ where: { planId } });
    await this.prisma.clinicPlanSpecialty.deleteMany({ where: { planId } });
    await this.populatePlanSpecialties(
      planId,
      storeId,
      pack,
      strand,
      new Date(),
    );
  }

  private async populatePlanSpecialties(
    planId: string,
    storeId: string,
    pack: ClinicSeedPack,
    strand: ClinicStrand,
    now: Date,
  ): Promise<void> {
    for (const [specialtyIndex, specialty] of pack.plan.specialties.entries()) {
      const specialtyRow = await this.prisma.clinicPlanSpecialty.create({
        data: {
          storeId,
          planId,
          name: specialty.name,
          locationUiType: resolveSeedSpecialtyLocationUiType(
            specialty.name,
            strand,
          ),
          sortOrder: specialtyIndex,
          updatedAt: now,
        },
      });

      if (specialty.treatments.length === 0) {
        continue;
      }

      await this.prisma.clinicPlanTreatment.createMany({
        data: specialty.treatments.map((treatment, treatmentIndex) => ({
          storeId,
          planId,
          specialtyId: specialtyRow.id,
          name: treatment.name,
          valueCents: treatment.valueCents,
          costCents: treatment.costCents,
          enabled: true,
          acceptsFaces: treatment.acceptsFaces,
          sortOrder: treatmentIndex,
          updatedAt: now,
        })),
      });
    }
  }

  private async seedContract(
    storeId: string,
    pack: ClinicSeedPack,
  ): Promise<void> {
    const existing = await this.prisma.contractModel.findFirst({
      where: { storeId, name: pack.contract.name },
    });
    if (existing) {
      return;
    }

    await this.prisma.contractModel.create({
      data: {
        storeId,
        name: pack.contract.name,
        content: pack.contract.content,
        isDefault: pack.contract.isDefault,
      },
    });
  }

  private async seedFinancial(
    storeId: string,
    pack: ClinicSeedPack,
  ): Promise<void> {
    const existingAccount = await this.prisma.financialAccount.findFirst({
      where: { storeId, name: pack.financialAccount.name },
    });
    if (!existingAccount) {
      await this.prisma.financialAccount.create({
        data: {
          storeId,
          name: pack.financialAccount.name,
          type: pack.financialAccount.type,
          isActive: true,
        },
      });
    }

    for (const category of pack.expenseCategories) {
      const existing = await this.prisma.financialCategory.findFirst({
        where: { storeId, kind: 'expense', name: category.name },
      });
      if (!existing) {
        await this.prisma.financialCategory.create({
          data: {
            storeId,
            kind: 'expense',
            name: category.name,
            color: category.color,
          },
        });
        continue;
      }
      if (!existing.color.trim()) {
        await this.prisma.financialCategory.update({
          where: { id: existing.id },
          data: { color: category.color },
        });
      }
    }

    for (const category of pack.incomeCategories) {
      const existing = await this.prisma.financialCategory.findFirst({
        where: { storeId, kind: 'income', name: category.name },
      });
      if (!existing) {
        await this.prisma.financialCategory.create({
          data: {
            storeId,
            kind: 'income',
            name: category.name,
            color: category.color,
          },
        });
        continue;
      }
      if (!existing.color.trim()) {
        await this.prisma.financialCategory.update({
          where: { id: existing.id },
          data: { color: category.color },
        });
      }
    }
  }

  private async seedPatientCategories(
    storeId: string,
    pack: ClinicSeedPack,
  ): Promise<string> {
    let particularId: string | null = null;

    for (const category of pack.patientCategories) {
      const existing = await this.prisma.patientCategory.findFirst({
        where: { storeId, name: category.name },
      });
      if (existing) {
        if (category.isProtected) {
          particularId = existing.id;
        }
        continue;
      }

      const created = await this.prisma.patientCategory.create({
        data: {
          storeId,
          name: category.name,
          colorId: category.colorId,
          isProtected: category.isProtected,
        },
      });
      if (category.isProtected) {
        particularId = created.id;
      }
    }

    if (!particularId) {
      throw new Error(`PatientCategory Particular missing for store ${storeId}`);
    }
    return particularId;
  }

  private async seedAppointmentCategories(
    storeId: string,
    pack: ClinicSeedPack,
  ): Promise<string> {
    const idsByName = new Map<string, string>();

    for (const category of pack.appointmentCategories) {
      const existing = await this.prisma.appointmentCategory.findFirst({
        where: { storeId, name: category.name },
      });
      if (existing) {
        idsByName.set(category.name, existing.id);
        continue;
      }

      const created = await this.prisma.appointmentCategory.create({
        data: {
          storeId,
          name: category.name,
          color: category.color,
        },
      });
      idsByName.set(category.name, created.id);
    }

    const demoCategoryId =
      idsByName.get(pack.demo.appointmentCategoryName) ??
      idsByName.get('Particular');

    if (!demoCategoryId) {
      throw new Error(
        `AppointmentCategory "${pack.demo.appointmentCategoryName}" missing for store ${storeId}`,
      );
    }
    return demoCategoryId;
  }

  private async seedDemoPatientAndAppointment(
    storeId: string,
    pack: ClinicSeedPack,
    patientCategoryId: string,
    appointmentCategoryId: string,
  ): Promise<void> {
    let patient = await this.prisma.patient.findFirst({
      where: { storeId, name: pack.demo.patientName },
    });
    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          storeId,
          name: pack.demo.patientName,
          gender: 'other',
          categoryId: patientCategoryId,
          status: 'active',
        },
      });
    }

    const professionalId = await this.resolveDemoProfessionalId(storeId);
    if (!professionalId) {
      this.logger.warn(
        `Seed demo appointment skipped for store ${storeId}: nenhum membro ativo na organização. Rode POST /v1/store-setup/${storeId}/retry após criar a equipe.`,
      );
      return;
    }

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        storeId,
        patientId: patient.id,
        notes: DEMO_APPOINTMENT_NOTES,
      },
    });

    if (existingAppointment) {
      const patch: {
        professionalId?: string;
        categoryId?: string;
        startAt?: Date;
        endAt?: Date;
      } = {};
      if (existingAppointment.professionalId !== professionalId) {
        patch.professionalId = professionalId;
      }
      if (existingAppointment.categoryId !== appointmentCategoryId) {
        patch.categoryId = appointmentCategoryId;
      }
      // Corrige seeds antigos que gravaram 12:00 UTC em vez de 09:00 wall-clock.
      if (existingAppointment.startAt.getUTCHours() !== 9) {
        const d = existingAppointment.startAt;
        const startAt = new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 9, 0, 0, 0),
        );
        patch.startAt = startAt;
        patch.endAt = new Date(
          startAt.getTime() + pack.demo.durationMin * 60_000,
        );
      }
      if (Object.keys(patch).length > 0) {
        await this.prisma.appointment.update({
          where: { id: existingAppointment.id },
          data: patch,
        });
      }
      return;
    }

    const startAt = nextDemoSlotStart();
    const endAt = new Date(startAt.getTime() + pack.demo.durationMin * 60_000);

    await this.prisma.appointment.create({
      data: {
        storeId,
        patientId: patient.id,
        professionalId,
        categoryId: appointmentCategoryId,
        status: 'scheduled',
        insuranceType: 'private',
        startAt,
        endAt,
        durationMin: pack.demo.durationMin,
        notes: DEMO_APPOINTMENT_NOTES,
      },
    });
  }

  /**
   * Profissional do agendamento demo, resolvido **localmente**.
   *
   * Antes isto fazia `$queryRaw` cross-schema em `platform.store_members` — a clínica
   * lendo tabela de outro serviço. Desde a Fase 4 a equipe é dela (`clinica.members`),
   * e o id preservado no backfill mantém o histórico apontando para a mesma pessoa.
   */
  private async resolveDemoProfessionalId(
    storeId: string,
  ): Promise<string | null> {
    const fromEnv = process.env.CLINIC_SEED_DEMO_PROFESSIONAL_ID?.trim();
    if (fromEnv) {
      return fromEnv;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { storeId },
      select: { id: true },
    });
    if (!organization) return null;

    const member = await this.prisma.member.findFirst({
      where: {
        organizationId: organization.id,
        status: 'active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return member?.id ?? null;
  }
}

/**
 * Próximo dia civil em America/Sao_Paulo às 09:00 **wall-clock** da clínica.
 * A agenda persiste horário como UTC literal (`T09:00:00.000Z` = 09:00 na UI).
 */
export function nextDemoSlotStart(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  return new Date(Date.UTC(year, month - 1, day + 1, 9, 0, 0, 0));
}
