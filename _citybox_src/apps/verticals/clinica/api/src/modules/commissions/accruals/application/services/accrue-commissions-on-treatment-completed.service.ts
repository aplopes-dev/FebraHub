import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionRuleRepository } from '../../../rules/domain/repositories/commission-rule.repository.interface';
import { CommissionAccrualRepository } from '../../domain/repositories/commission-accrual.repository.interface';
import { CreateCommissionAccrualUseCase } from '../use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { toIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import { formatCommissionTreatmentName } from './debit-received-commission.math';
import { loadWildcardSpecialtyNamesById } from './load-wildcard-specialty-names';
import {
  calculateTreatmentCompletedCommissionCents,
  matchTreatmentCompletedRule,
  type TreatmentCompletedLineItem,
} from './treatment-completed-commission.math';

export type AccrueOnTreatmentCompletedInput = {
  storeId: string;
  patientId: string;
  patientTreatmentId: string;
  professionalId: string | null;
  professionalName: string;
  planId: string | null;
  planName: string;
  treatmentId: string | null;
  treatmentName: string;
  locationLabel: string | null;
  valueCents: number;
  finalizedAt: Date;
};

@Injectable()
export class AccrueCommissionsOnTreatmentCompletedService {
  private readonly logger = new Logger(
    AccrueCommissionsOnTreatmentCompletedService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleRepository: CommissionRuleRepository,
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly createCommissionAccrual: CreateCommissionAccrualUseCase,
  ) {}

  /**
   * Gera accrual `treatment_completed` somente no fluxo
   * Paciente → Tratamentos → Finalizar (cria evolução `source=treatment`).
   * Evolução avulsa (`source=standalone`) NÃO gera comissão.
   * Idempotente por `sourcePatientTreatmentId`.
   */
  async execute(input: AccrueOnTreatmentCompletedInput): Promise<void> {
    if (!input.professionalId?.trim()) return;
    if (input.valueCents <= 0) return;

    const existing =
      await this.accrualRepository.findBySourcePatientTreatmentId(
        input.storeId,
        input.patientTreatmentId,
      );
    if (existing.length > 0) return;

    try {
      const item = await this.resolveLineItem(input);
      if (!item) return;

      const rules = await this.ruleRepository.findByMember(
        input.storeId,
        input.professionalId,
      );
      const specialtyNameById = await loadWildcardSpecialtyNamesById(
        this.prisma,
        input.storeId,
        rules,
      );
      const rule = matchTreatmentCompletedRule(rules, item, specialtyNameById);
      if (!rule) return;

      const commissionCents = calculateTreatmentCompletedCommissionCents(
        rule,
        item,
      );
      if (commissionCents <= 0) return;

      const patientName = await this.resolvePatientName(
        input.storeId,
        input.patientId,
      );

      await this.createCommissionAccrual.execute({
        storeId: input.storeId,
        memberId: input.professionalId,
        memberName:
          rule.memberName.trim() ||
          item.professionalName.trim() ||
          'Profissional',
        ruleId: rule.id,
        paymentTrigger: 'treatment_completed',
        planName: item.planName,
        specialtyName: item.specialtyName,
        treatmentName: item.treatmentName,
        patientName,
        paidValueCents: item.itemValueCents,
        treatmentCostCents: item.treatmentCostCents,
        installment: null,
        commissionCents,
        accruedAt: toIsoDateOnly(input.finalizedAt),
        sourcePatientTreatmentId: input.patientTreatmentId,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gerar comissão treatment_completed para treatment ${input.patientTreatmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async resolveLineItem(
    input: AccrueOnTreatmentCompletedInput,
  ): Promise<TreatmentCompletedLineItem | null> {
    let specialtyId = '';
    let specialtyName = '';
    let treatmentCostCents = 0;
    let planName = input.planName.trim();

    if (input.planId && input.treatmentId) {
      const [plan, planTreatment] = await Promise.all([
        this.prisma.clinicPlan.findFirst({
          where: { id: input.planId, storeId: input.storeId },
          select: { name: true },
        }),
        this.prisma.clinicPlanTreatment.findFirst({
          where: {
            id: input.treatmentId,
            planId: input.planId,
            storeId: input.storeId,
          },
        }),
      ]);

      if (plan?.name) {
        planName = plan.name;
      }

      if (planTreatment) {
        treatmentCostCents = planTreatment.costCents;
        specialtyId = planTreatment.specialtyId;
        if (specialtyId) {
          const specialty = await this.prisma.clinicPlanSpecialty.findFirst({
            where: { id: specialtyId, storeId: input.storeId },
            select: { name: true },
          });
          specialtyName = specialty?.name?.trim() ?? '';
        }
      }
    }

    return {
      professionalId: input.professionalId ?? '',
      professionalName: input.professionalName,
      planId: input.planId ?? '',
      planName,
      treatmentId: input.treatmentId ?? '',
      treatmentName: formatCommissionTreatmentName(
        input.treatmentName,
        input.locationLabel,
      ),
      specialtyId,
      specialtyName,
      itemValueCents: input.valueCents,
      treatmentCostCents,
    };
  }

  private async resolvePatientName(
    storeId: string,
    patientId: string,
  ): Promise<string> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, storeId },
      select: { name: true },
    });
    return patient?.name?.trim() || 'Paciente';
  }
}
