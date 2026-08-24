import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionRuleRepository } from '../../../rules/domain/repositories/commission-rule.repository.interface';
import { CommissionAccrualRepository } from '../../domain/repositories/commission-accrual.repository.interface';
import { CreateCommissionAccrualUseCase } from '../use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { toIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import {
  buildDebitCommissionMatches,
  formatCommissionTreatmentName,
  parseBrlStringToCents,
  resolveInstallmentLabel,
  type DebitReceivedLineItem,
} from './debit-received-commission.math';
import { loadWildcardSpecialtyNamesById } from './load-wildcard-specialty-names';

export type AccrueOnDebitReceivedInput = {
  storeId: string;
  financialEntryId: string;
  source: string;
  patientId: string | null;
  budgetId: string | null;
  description: string;
  valueCents: number;
  paidValueCents: number;
  paidAt: Date;
  installmentIndex: number | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  debitDetail: Record<string, unknown> | null;
};

@Injectable()
export class AccrueCommissionsOnDebitReceivedService {
  private readonly logger = new Logger(AccrueCommissionsOnDebitReceivedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleRepository: CommissionRuleRepository,
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly createCommissionAccrual: CreateCommissionAccrualUseCase,
  ) {}

  /**
   * Gera accruals `debit_received` após receber um débito.
   * Independente do meio de pagamento (cash/pix/transfer/check/card…).
   * Idempotente por `sourceFinancialEntryId`.
   */
  async execute(input: AccrueOnDebitReceivedInput): Promise<void> {
    if (input.source !== 'budget_approve' && input.source !== 'avulso_debit') {
      return;
    }

    if (input.paidValueCents <= 0) {
      return;
    }

    const existing = await this.accrualRepository.findBySourceFinancialEntryId(
      input.storeId,
      input.financialEntryId,
    );
    if (existing.length > 0) {
      return;
    }

    try {
      const items = await this.resolveLineItems(input);
      if (items.length === 0) {
        return;
      }

      const professionalIds = [...new Set(items.map((i) => i.professionalId))];
      const rulesByMember = new Map(
        await Promise.all(
          professionalIds.map(async (memberId) => {
            const rules = await this.ruleRepository.findByMember(
              input.storeId,
              memberId,
            );
            return [memberId, rules] as const;
          }),
        ),
      );

      const specialtyNameById = await loadWildcardSpecialtyNamesById(
        this.prisma,
        input.storeId,
        [...rulesByMember.values()].flat(),
      );

      const matches = buildDebitCommissionMatches(
        rulesByMember,
        items,
        input.paidValueCents,
        specialtyNameById,
      );
      if (matches.length === 0) {
        return;
      }

      const patientName = await this.resolvePatientName(
        input.storeId,
        input.patientId,
      );
      const installment = resolveInstallmentLabel({
        description: input.description,
        installmentNumber: input.installmentNumber,
        totalInstallments: input.totalInstallments,
        installmentIndex: input.installmentIndex,
      });
      const accruedAt = toIsoDateOnly(input.paidAt);

      for (const match of matches) {
        await this.createCommissionAccrual.execute({
          storeId: input.storeId,
          memberId: match.item.professionalId,
          memberName:
            match.rule.memberName.trim() ||
            match.item.professionalName.trim() ||
            'Profissional',
          ruleId: match.rule.id,
          paymentTrigger: 'debit_received',
          planName: match.item.planName,
          specialtyName: match.item.specialtyName,
          treatmentName: match.item.treatmentName,
          patientName,
          paidValueCents: match.itemPaidValueCents,
          treatmentCostCents: match.item.treatmentCostCents,
          installment,
          commissionCents: match.commissionCents,
          accruedAt,
          sourceFinancialEntryId: input.financialEntryId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Falha ao gerar comissões debit_received para entry ${input.financialEntryId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async resolveLineItems(
    input: AccrueOnDebitReceivedInput,
  ): Promise<DebitReceivedLineItem[]> {
    if (input.source === 'budget_approve' && input.budgetId && input.patientId) {
      return this.resolveBudgetItems(
        input.storeId,
        input.patientId,
        input.budgetId,
      );
    }

    if (input.source === 'avulso_debit' && input.debitDetail) {
      return this.resolveAvulsoItems(input.storeId, input.debitDetail);
    }

    return [];
  }

  private async resolveBudgetItems(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<DebitReceivedLineItem[]> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, storeId, patientId },
      include: { items: true },
    });
    if (!budget || budget.items.length === 0) {
      return [];
    }

    const planIds = [...new Set(budget.items.map((item) => item.planId))];
    const planAggregates = await Promise.all(
      planIds.map(async (planId) => {
        const [treatments, specialties] = await Promise.all([
          this.prisma.clinicPlanTreatment.findMany({
            where: { storeId, planId },
          }),
          this.prisma.clinicPlanSpecialty.findMany({
            where: { storeId, planId },
          }),
        ]);
        return { planId, treatments, specialties };
      }),
    );

    const planMeta = new Map(
      planAggregates.map((agg) => [
        agg.planId,
        {
          treatmentById: new Map(agg.treatments.map((t) => [t.id, t])),
          specialtyById: new Map(agg.specialties.map((s) => [s.id, s])),
        },
      ]),
    );

    return budget.items.map((item) => {
      const meta = planMeta.get(item.planId);
      const planTreatment = meta?.treatmentById.get(item.treatmentId);
      const specialtyId = planTreatment?.specialtyId ?? '';
      const specialtyName =
        (specialtyId
          ? meta?.specialtyById.get(specialtyId)?.name
          : undefined) ?? '';

      return {
        professionalId: item.professionalId,
        professionalName: item.professionalName,
        planId: item.planId,
        planName: item.planName,
        treatmentId: item.treatmentId,
        treatmentName: formatCommissionTreatmentName(
          item.treatmentName,
          item.locationLabel,
        ),
        specialtyId,
        specialtyName,
        itemValueCents: item.valueCents,
        treatmentCostCents: planTreatment?.costCents ?? 0,
      };
    });
  }

  private async resolveAvulsoItems(
    storeId: string,
    debitDetail: Record<string, unknown>,
  ): Promise<DebitReceivedLineItem[]> {
    const treatmentsRaw = debitDetail.treatments;
    if (!Array.isArray(treatmentsRaw) || treatmentsRaw.length === 0) {
      return [];
    }

    const treatments = treatmentsRaw.filter(
      (row): row is Record<string, unknown> =>
        typeof row === 'object' && row !== null,
    );

    const planIds = [
      ...new Set(
        treatments
          .map((row) =>
            typeof row.planId === 'string' ? row.planId : null,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const planAggregates = await Promise.all(
      planIds.map(async (planId) => {
        const [planTreatments, specialties, plan] = await Promise.all([
          this.prisma.clinicPlanTreatment.findMany({
            where: { storeId, planId },
          }),
          this.prisma.clinicPlanSpecialty.findMany({
            where: { storeId, planId },
          }),
          this.prisma.clinicPlan.findFirst({ where: { id: planId, storeId } }),
        ]);
        return { planId, plan, planTreatments, specialties };
      }),
    );

    const planMeta = new Map(
      planAggregates.map((agg) => [
        agg.planId,
        {
          planName: agg.plan?.name ?? '',
          treatmentById: new Map(agg.planTreatments.map((t) => [t.id, t])),
          specialtyById: new Map(agg.specialties.map((s) => [s.id, s])),
        },
      ]),
    );

    const items: DebitReceivedLineItem[] = [];
    for (const row of treatments) {
      const planId = typeof row.planId === 'string' ? row.planId : '';
      const treatmentId =
        typeof row.treatmentId === 'string' ? row.treatmentId : '';
      const professionalId =
        typeof row.professionalId === 'string' ? row.professionalId : '';
      if (!planId || !treatmentId || !professionalId) continue;

      const meta = planMeta.get(planId);
      const planTreatment = meta?.treatmentById.get(treatmentId);
      const specialtyId = planTreatment?.specialtyId ?? '';
      const specialtyName =
        (specialtyId
          ? meta?.specialtyById.get(specialtyId)?.name
          : undefined) ?? '';
      const value =
        typeof row.value === 'string' ? parseBrlStringToCents(row.value) : 0;
      const rawTreatmentName =
        typeof row.treatmentName === 'string'
          ? row.treatmentName
          : (planTreatment?.name ?? '');
      const toothNumber =
        typeof row.toothNumber === 'number'
          ? row.toothNumber
          : typeof row.toothNumber === 'string' && row.toothNumber.trim()
            ? Number(row.toothNumber)
            : null;

      items.push({
        professionalId,
        professionalName:
          typeof row.professionalName === 'string'
            ? row.professionalName
            : '',
        planId,
        planName: meta?.planName ?? '',
        treatmentId,
        treatmentName: formatCommissionTreatmentName(
          rawTreatmentName,
          Number.isFinite(toothNumber) ? toothNumber : null,
        ),
        specialtyId,
        specialtyName,
        itemValueCents: value,
        treatmentCostCents: planTreatment?.costCents ?? 0,
      });
    }

    return items;
  }

  private async resolvePatientName(
    storeId: string,
    patientId: string | null,
  ): Promise<string> {
    if (!patientId) return 'Paciente';
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, storeId },
      select: { name: true },
    });
    return patient?.name?.trim() || 'Paciente';
  }
}
