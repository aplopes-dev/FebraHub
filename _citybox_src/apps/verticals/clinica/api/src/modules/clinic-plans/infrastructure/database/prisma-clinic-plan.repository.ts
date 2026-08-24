import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ClinicPlan,
  type ClinicPlanProps,
} from '../../domain/entities/clinic-plan.entity';
import {
  ClinicPlanSpecialty,
  type ClinicPlanSpecialtyProps,
} from '../../domain/entities/clinic-plan-specialty.entity';
import {
  ClinicPlanTreatment,
  type ClinicPlanTreatmentProps,
} from '../../domain/entities/clinic-plan-treatment.entity';
import { ClinicPlanTreatmentsInUseError } from '../../domain/errors/clinic-plan.errors';
import {
  ClinicPlanRepository,
  type ClinicPlanAggregate,
} from '../../domain/repositories/clinic-plan.repository.interface';

type PlanRow = {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  treatmentInit: 'copy_default' | 'empty' | null;
  createdAt: Date;
  updatedAt: Date;
};

type SpecialtyRow = {
  id: string;
  storeId: string;
  planId: string;
  name: string;
  locationUiType: 'tooth' | 'face_region' | 'body_region' | 'session' | 'none';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type TreatmentRow = {
  id: string;
  storeId: string;
  planId: string;
  specialtyId: string;
  name: string;
  valueCents: number;
  costCents: number;
  enabled: boolean;
  acceptsFaces: boolean;
  locationUiType: 'tooth' | 'face_region' | 'body_region' | 'session' | 'none' | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaClinicPlanRepository extends ClinicPlanRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<ClinicPlan[]> {
    const rows = await this.prisma.clinicPlan.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.toPlanEntity(row));
  }

  async findById(storeId: string, id: string): Promise<ClinicPlan | null> {
    const row = await this.prisma.clinicPlan.findFirst({
      where: { id, storeId },
    });
    return row ? this.toPlanEntity(row) : null;
  }

  async findDefaultActiveByStoreId(
    storeId: string,
  ): Promise<ClinicPlan | null> {
    const row = await this.prisma.clinicPlan.findFirst({
      where: { storeId, isDefault: true, status: 'active' },
    });
    return row ? this.toPlanEntity(row) : null;
  }

  async getMaxSortOrder(storeId: string): Promise<number> {
    const row = await this.prisma.clinicPlan.findFirst({
      where: { storeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return row?.sortOrder ?? 0;
  }

  async save(plan: ClinicPlan): Promise<ClinicPlan> {
    const row = await this.prisma.clinicPlan.upsert({
      where: { id: plan.id },
      create: this.planToCreateData(plan),
      update: this.planToUpdateData(plan),
    });
    return this.toPlanEntity(row);
  }

  async clearDefaultForStore(
    storeId: string,
    exceptPlanId?: string,
  ): Promise<void> {
    await this.prisma.clinicPlan.updateMany({
      where: {
        storeId,
        isDefault: true,
        ...(exceptPlanId ? { id: { not: exceptPlanId } } : {}),
      },
      data: { isDefault: false, updatedAt: new Date() },
    });
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.clinicPlan.deleteMany({ where: { id, storeId } });
  }

  async countLinkedUsage(storeId: string, planId: string): Promise<number> {
    const [patients, budgetItems] = await Promise.all([
      this.prisma.patient.count({ where: { storeId, planId } }),
      this.prisma.budgetItem.count({ where: { storeId, planId } }),
    ]);
    return patients + budgetItems;
  }

  async findAggregateById(
    storeId: string,
    id: string,
  ): Promise<ClinicPlanAggregate | null> {
    const plan = await this.findById(storeId, id);
    if (!plan) return null;

    const [specialtyRows, treatmentRows] = await Promise.all([
      this.prisma.clinicPlanSpecialty.findMany({
        where: { storeId, planId: id },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.clinicPlanTreatment.findMany({
        where: { storeId, planId: id },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return {
      plan,
      specialties: specialtyRows.map((row) => this.toSpecialtyEntity(row)),
      treatments: treatmentRows.map((row) => this.toTreatmentEntity(row)),
    };
  }

  async saveAggregate(
    aggregate: ClinicPlanAggregate,
  ): Promise<ClinicPlanAggregate> {
    await this.prisma.$transaction(async (tx) => {
      if (aggregate.plan.isDefault) {
        await tx.clinicPlan.updateMany({
          where: {
            storeId: aggregate.plan.storeId,
            id: { not: aggregate.plan.id },
            isDefault: true,
          },
          data: { isDefault: false, updatedAt: new Date() },
        });
      }

      await tx.clinicPlan.create({
        data: this.planToCreateData(aggregate.plan),
      });

      if (aggregate.specialties.length > 0) {
        await tx.clinicPlanSpecialty.createMany({
          data: aggregate.specialties.map((specialty) =>
            this.specialtyToCreateData(specialty),
          ),
        });
      }

      if (aggregate.treatments.length > 0) {
        await tx.clinicPlanTreatment.createMany({
          data: aggregate.treatments.map((treatment) =>
            this.treatmentToCreateData(treatment),
          ),
        });
      }
    });

    const saved = await this.findAggregateById(
      aggregate.plan.storeId,
      aggregate.plan.id,
    );
    return saved ?? aggregate;
  }

  async replaceTree(
    plan: ClinicPlan,
    specialties: ClinicPlanSpecialty[],
    treatments: ClinicPlanTreatment[],
  ): Promise<ClinicPlanAggregate> {
    await this.prisma.$transaction(async (tx) => {
      if (plan.isDefault) {
        await tx.clinicPlan.updateMany({
          where: {
            storeId: plan.storeId,
            id: { not: plan.id },
            isDefault: true,
          },
          data: { isDefault: false, updatedAt: new Date() },
        });
      }

      await tx.clinicPlan.update({
        where: { id: plan.id },
        data: this.planToUpdateData(plan),
      });

      const specialtyIds = specialties.map((specialty) => specialty.id);
      const treatmentIds = treatments.map((treatment) => treatment.id);

      for (const specialty of specialties) {
        await tx.clinicPlanSpecialty.upsert({
          where: { id: specialty.id },
          create: this.specialtyToCreateData(specialty),
          update: {
            name: specialty.name,
            locationUiType: specialty.locationUiType,
            sortOrder: specialty.sortOrder,
            planId: specialty.planId,
            storeId: specialty.storeId,
            updatedAt: specialty.updatedAt,
          },
        });
      }

      for (const treatment of treatments) {
        await tx.clinicPlanTreatment.upsert({
          where: { id: treatment.id },
          create: this.treatmentToCreateData(treatment),
          update: {
            name: treatment.name,
            specialtyId: treatment.specialtyId,
            valueCents: treatment.valueCents,
            costCents: treatment.costCents,
            enabled: treatment.enabled,
            acceptsFaces: treatment.acceptsFaces,
            locationUiType: treatment.locationUiType,
            sortOrder: treatment.sortOrder,
            planId: treatment.planId,
            storeId: treatment.storeId,
            updatedAt: treatment.updatedAt,
          },
        });
      }

      const obsoleteTreatments = await tx.clinicPlanTreatment.findMany({
        where: {
          planId: plan.id,
          storeId: plan.storeId,
          ...(treatmentIds.length > 0
            ? { id: { notIn: treatmentIds } }
            : {}),
        },
        select: { id: true },
      });

      if (obsoleteTreatments.length > 0) {
        const obsoleteIds = obsoleteTreatments.map((row) => row.id);
        const linkedBudgetItems = await tx.budgetItem.count({
          where: {
            storeId: plan.storeId,
            treatmentId: { in: obsoleteIds },
          },
        });

        if (linkedBudgetItems > 0) {
          throw new ClinicPlanTreatmentsInUseError(
            PrismaClinicPlanRepository.name,
            plan.id,
          );
        }

        await tx.clinicPlanTreatment.deleteMany({
          where: {
            planId: plan.id,
            storeId: plan.storeId,
            id: { in: obsoleteIds },
          },
        });
      }

      await tx.clinicPlanSpecialty.deleteMany({
        where: {
          planId: plan.id,
          storeId: plan.storeId,
          ...(specialtyIds.length > 0
            ? { id: { notIn: specialtyIds } }
            : {}),
        },
      });
    });

    const saved = await this.findAggregateById(plan.storeId, plan.id);
    if (!saved) {
      return { plan, specialties, treatments };
    }
    return saved;
  }

  private planToCreateData(plan: ClinicPlan) {
    return {
      id: plan.id,
      storeId: plan.storeId,
      name: plan.name,
      sortOrder: plan.sortOrder,
      status: plan.status,
      isDefault: plan.isDefault,
      treatmentInit: plan.treatmentInit,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private planToUpdateData(plan: ClinicPlan) {
    return {
      name: plan.name,
      sortOrder: plan.sortOrder,
      status: plan.status,
      isDefault: plan.isDefault,
      treatmentInit: plan.treatmentInit,
      updatedAt: plan.updatedAt,
    };
  }

  private specialtyToCreateData(specialty: ClinicPlanSpecialty) {
    return {
      id: specialty.id,
      storeId: specialty.storeId,
      planId: specialty.planId,
      name: specialty.name,
      locationUiType: specialty.locationUiType,
      sortOrder: specialty.sortOrder,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
    };
  }

  private treatmentToCreateData(treatment: ClinicPlanTreatment) {
    return {
      id: treatment.id,
      storeId: treatment.storeId,
      planId: treatment.planId,
      specialtyId: treatment.specialtyId,
      name: treatment.name,
      valueCents: treatment.valueCents,
      costCents: treatment.costCents,
      enabled: treatment.enabled,
      acceptsFaces: treatment.acceptsFaces,
      locationUiType: treatment.locationUiType,
      sortOrder: treatment.sortOrder,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt,
    };
  }

  private toPlanEntity(row: PlanRow): ClinicPlan {
    const props: ClinicPlanProps = {
      storeId: row.storeId,
      name: row.name,
      sortOrder: row.sortOrder,
      status: row.status,
      isDefault: row.isDefault,
      treatmentInit: row.treatmentInit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ClinicPlan.with(props, row.id);
  }

  private toSpecialtyEntity(row: SpecialtyRow): ClinicPlanSpecialty {
    const props: ClinicPlanSpecialtyProps = {
      storeId: row.storeId,
      planId: row.planId,
      name: row.name,
      locationUiType: row.locationUiType,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ClinicPlanSpecialty.with(props, row.id);
  }

  private toTreatmentEntity(row: TreatmentRow): ClinicPlanTreatment {
    const props: ClinicPlanTreatmentProps = {
      storeId: row.storeId,
      planId: row.planId,
      specialtyId: row.specialtyId,
      name: row.name,
      valueCents: row.valueCents,
      costCents: row.costCents,
      enabled: row.enabled,
      acceptsFaces: row.acceptsFaces,
      locationUiType: row.locationUiType,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ClinicPlanTreatment.with(props, row.id);
  }
}
