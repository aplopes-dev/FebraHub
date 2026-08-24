import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { BudgetRepository } from '../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import { PatientTreatmentRepository } from '../../../patients/patient-treatments/domain/repositories/patient-treatment.repository.interface';
import { FinancialEntryRepository } from '../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import {
  allocateProportionally,
  parseBrlValueToCents,
} from './dashboard-revenue.math';
import type {
  DashboardRevenueLine,
  SpecialtyRef,
} from './dashboard-revenue.types';
import {
  UNINFORMED_DIMENSION_KEY,
  UNINFORMED_DIMENSION_NAME,
} from './dashboard-revenue.types';

type DebitTreatmentSnapshot = {
  id?: string;
  planId?: string;
  treatmentId?: string;
  treatmentName?: string;
  value?: string;
  valueCents?: number;
  professionalId?: string;
};

@Injectable()
export class DashboardRevenueBuilder {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async buildReceiptLines(
    storeId: string,
    startIsoDate: string,
    endIsoDate: string,
  ): Promise<DashboardRevenueLine[]> {
    const loaded =
      await this.financialEntryRepository.listReceivedIncomeInPaidAtRange(
        storeId,
        startIsoDate,
        endIsoDate,
      );

    const budgetIds = [
      ...new Set(
        loaded
          .map((row) => row.entry.budgetId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const budgets = await this.budgetRepository.findManyDetailsByIds(
      storeId,
      budgetIds,
    );
    const budgetById = new Map(budgets.map((row) => [row.budget.id, row]));

    const treatmentIds = new Set<string>();
    for (const budget of budgets) {
      for (const item of budget.items) {
        treatmentIds.add(item.treatmentId);
      }
    }
    for (const row of loaded) {
      if (row.entry.source !== 'avulso_debit' || !row.entry.debitDetail) {
        continue;
      }
      for (const treatment of this.readDebitTreatments(row.entry.debitDetail)) {
        if (treatment.treatmentId) treatmentIds.add(treatment.treatmentId);
      }
    }

    const specialtyByTreatmentId = await this.loadSpecialtyMap(
      storeId,
      [...treatmentIds],
    );

    const lines: DashboardRevenueLine[] = [];

    for (const row of loaded) {
      const entry = row.entry;
      const paidAt = entry.paidAt ? toIsoDateOnly(entry.paidAt) : null;
      if (!paidAt) continue;

      const valueCents = entry.paidValueCents ?? entry.valueCents;
      const patientId = entry.patientId ?? '';
      const patientName = row.patient?.name ?? 'Paciente';

      if (entry.source === 'budget_approve' && entry.budgetId) {
        const budgetDetail = budgetById.get(entry.budgetId);
        const items = budgetDetail?.items ?? [];
        if (items.length === 0) {
          lines.push(
            this.uninformedLine({
              id: entry.id,
              date: paidAt,
              patientId,
              patientName,
              valueCents,
              treatmentName: entry.description || 'Orçamento',
            }),
          );
          continue;
        }

        const allocations = allocateProportionally(
          valueCents,
          items.map((item) => item.valueCents),
        );

        items.forEach((item, index) => {
          const specialty = specialtyByTreatmentId.get(item.treatmentId);
          lines.push({
            id: `${entry.id}:${item.id}`,
            date: paidAt,
            patientId,
            patientName,
            treatmentName: item.treatmentName,
            valueCents: allocations[index] ?? 0,
            professionalId: item.professionalId,
            professionalName: item.professionalName,
            planId: item.planId,
            planName: item.planName || specialty?.planName || '',
            treatmentId: item.treatmentId,
            specialtyId: specialty?.specialtyId ?? UNINFORMED_DIMENSION_KEY,
            specialtyName:
              specialty?.specialtyName ?? UNINFORMED_DIMENSION_NAME,
          });
        });
        continue;
      }

      if (entry.source === 'avulso_debit' && entry.debitDetail) {
        const treatments = this.readDebitTreatments(entry.debitDetail);
        if (treatments.length === 0) {
          lines.push(
            this.uninformedLine({
              id: entry.id,
              date: paidAt,
              patientId,
              patientName,
              valueCents,
              treatmentName: entry.description || 'Débito avulso',
            }),
          );
          continue;
        }

        const weights = treatments.map((treatment) =>
          typeof treatment.valueCents === 'number'
            ? treatment.valueCents
            : parseBrlValueToCents(treatment.value),
        );
        const allocations = allocateProportionally(valueCents, weights);

        treatments.forEach((treatment, index) => {
          const treatmentId = treatment.treatmentId ?? '';
          const specialty = treatmentId
            ? specialtyByTreatmentId.get(treatmentId)
            : undefined;
          lines.push({
            id: `${entry.id}:${treatment.id ?? index}`,
            date: paidAt,
            patientId,
            patientName,
            treatmentName: treatment.treatmentName ?? 'Tratamento',
            valueCents: allocations[index] ?? 0,
            professionalId: treatment.professionalId ?? '',
            professionalName: treatment.professionalId
              ? treatment.professionalId
              : UNINFORMED_DIMENSION_NAME,
            planId: treatment.planId ?? '',
            planName: specialty?.planName ?? UNINFORMED_DIMENSION_NAME,
            treatmentId,
            specialtyId: specialty?.specialtyId ?? UNINFORMED_DIMENSION_KEY,
            specialtyName:
              specialty?.specialtyName ?? UNINFORMED_DIMENSION_NAME,
          });
        });
        continue;
      }

      lines.push(
        this.uninformedLine({
          id: entry.id,
          date: paidAt,
          patientId,
          patientName,
          valueCents,
          treatmentName: entry.description || 'Receita',
        }),
      );
    }

    return lines;
  }

  async buildSaleLines(
    storeId: string,
    startIsoDate: string,
    endIsoDate: string,
  ): Promise<DashboardRevenueLine[]> {
    const [approved, standalones, avulsos] = await Promise.all([
      this.budgetRepository.listApprovedBudgetsInRange(storeId, {
        startIsoDate,
        endIsoDate,
      }),
      this.treatmentRepository.listStandaloneActiveInRange(storeId, {
        startIsoDate,
        endIsoDate,
      }),
      this.financialEntryRepository.listAvulsoDebitsInDueDateRange(
        storeId,
        startIsoDate,
        endIsoDate,
      ),
    ]);

    const treatmentIds = new Set<string>();
    for (const row of approved) {
      for (const item of row.items) treatmentIds.add(item.treatmentId);
    }
    for (const row of standalones) {
      if (row.treatment.treatmentId) treatmentIds.add(row.treatment.treatmentId);
    }
    for (const row of avulsos) {
      if (!row.entry.debitDetail) continue;
      for (const treatment of this.readDebitTreatments(row.entry.debitDetail)) {
        if (treatment.treatmentId) treatmentIds.add(treatment.treatmentId);
      }
    }

    const specialtyByTreatmentId = await this.loadSpecialtyMap(
      storeId,
      [...treatmentIds],
    );

    const lines: DashboardRevenueLine[] = [];

    for (const row of approved) {
      const saleDate = toIsoDateOnly(row.budget.approvedAt ?? row.budget.date);
      if (saleDate < startIsoDate || saleDate > endIsoDate) continue;

      for (const item of row.items) {
        const specialty = specialtyByTreatmentId.get(item.treatmentId);
        lines.push({
          id: item.id,
          date: saleDate,
          patientId: row.budget.patientId,
          patientName: row.patientName,
          treatmentName: item.treatmentName,
          valueCents: item.valueCents,
          professionalId: item.professionalId,
          professionalName: item.professionalName,
          planId: item.planId,
          planName: item.planName || specialty?.planName || '',
          treatmentId: item.treatmentId,
          specialtyId: specialty?.specialtyId ?? UNINFORMED_DIMENSION_KEY,
          specialtyName: specialty?.specialtyName ?? UNINFORMED_DIMENSION_NAME,
          origin: 'approved_budget',
        });
      }
    }

    for (const row of standalones) {
      const treatment = row.treatment;
      const saleDate = toIsoDateOnly(treatment.createdAt);
      const treatmentId = treatment.treatmentId ?? '';
      const specialty = treatmentId
        ? specialtyByTreatmentId.get(treatmentId)
        : undefined;

      lines.push({
        id: treatment.id,
        date: saleDate,
        patientId: treatment.patientId,
        patientName: row.patientName,
        treatmentName: treatment.treatmentName,
        valueCents: treatment.valueCents,
        professionalId: treatment.professionalId ?? '',
        professionalName:
          treatment.professionalName || UNINFORMED_DIMENSION_NAME,
        planId: treatment.planId ?? '',
        planName: treatment.planName || specialty?.planName || '',
        treatmentId,
        specialtyId: specialty?.specialtyId ?? UNINFORMED_DIMENSION_KEY,
        specialtyName: specialty?.specialtyName ?? UNINFORMED_DIMENSION_NAME,
        origin: 'treatment_in_progress',
      });
    }

    for (const row of avulsos) {
      const entry = row.entry;
      const saleDate = toIsoDateOnly(entry.dueDate);
      const patientId = entry.patientId ?? '';
      const patientName = row.patient?.name ?? 'Paciente';
      const treatments = entry.debitDetail
        ? this.readDebitTreatments(entry.debitDetail)
        : [];

      if (treatments.length === 0) {
        lines.push({
          ...this.uninformedLine({
            id: entry.id,
            date: saleDate,
            patientId,
            patientName,
            valueCents: entry.valueCents,
            treatmentName: entry.description || 'Débito avulso',
          }),
          origin: 'manual_debit',
        });
        continue;
      }

      for (const [index, treatment] of treatments.entries()) {
        const treatmentId = treatment.treatmentId ?? '';
        const specialty = treatmentId
          ? specialtyByTreatmentId.get(treatmentId)
          : undefined;
        const valueCents =
          typeof treatment.valueCents === 'number'
            ? treatment.valueCents
            : parseBrlValueToCents(treatment.value);

        lines.push({
          id: `${entry.id}:${treatment.id ?? index}`,
          date: saleDate,
          patientId,
          patientName,
          treatmentName: treatment.treatmentName ?? 'Tratamento',
          valueCents,
          professionalId: treatment.professionalId ?? '',
          professionalName: treatment.professionalId
            ? treatment.professionalId
            : UNINFORMED_DIMENSION_NAME,
          planId: treatment.planId ?? '',
          planName: specialty?.planName ?? UNINFORMED_DIMENSION_NAME,
          treatmentId,
          specialtyId: specialty?.specialtyId ?? UNINFORMED_DIMENSION_KEY,
          specialtyName: specialty?.specialtyName ?? UNINFORMED_DIMENSION_NAME,
          origin: 'manual_debit',
        });
      }
    }

    return lines;
  }

  private uninformedLine(input: {
    id: string;
    date: string;
    patientId: string;
    patientName: string;
    valueCents: number;
    treatmentName: string;
  }): DashboardRevenueLine {
    return {
      id: input.id,
      date: input.date,
      patientId: input.patientId,
      patientName: input.patientName,
      treatmentName: input.treatmentName,
      valueCents: input.valueCents,
      professionalId: UNINFORMED_DIMENSION_KEY,
      professionalName: UNINFORMED_DIMENSION_NAME,
      planId: UNINFORMED_DIMENSION_KEY,
      planName: UNINFORMED_DIMENSION_NAME,
      treatmentId: UNINFORMED_DIMENSION_KEY,
      specialtyId: UNINFORMED_DIMENSION_KEY,
      specialtyName: UNINFORMED_DIMENSION_NAME,
    };
  }

  private readDebitTreatments(
    debitDetail: Record<string, unknown>,
  ): DebitTreatmentSnapshot[] {
    const raw = debitDetail.treatments;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (row): row is DebitTreatmentSnapshot =>
        typeof row === 'object' && row !== null,
    );
  }

  private async loadSpecialtyMap(
    storeId: string,
    treatmentIds: string[],
  ): Promise<Map<string, SpecialtyRef>> {
    const uniqueIds = [...new Set(treatmentIds.filter(Boolean))];
    if (uniqueIds.length === 0) return new Map();

    const rows = await this.prisma.clinicPlanTreatment.findMany({
      where: { storeId, id: { in: uniqueIds } },
      select: {
        id: true,
        specialtyId: true,
        plan: { select: { name: true } },
        specialty: { select: { id: true, name: true } },
      },
    });

    return new Map(
      rows.map((row) => [
        row.id,
        {
          specialtyId: row.specialty.id,
          specialtyName: row.specialty.name,
          planName: row.plan.name,
        } satisfies SpecialtyRef,
      ]),
    );
  }
}
