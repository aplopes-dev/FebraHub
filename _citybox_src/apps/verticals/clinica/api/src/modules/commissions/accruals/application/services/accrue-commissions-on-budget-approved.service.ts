import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionRuleRepository } from '../../../rules/domain/repositories/commission-rule.repository.interface';
import { CommissionAccrualRepository } from '../../domain/repositories/commission-accrual.repository.interface';
import { CreateCommissionAccrualUseCase } from '../use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { toIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import {
  calculateBudgetApprovedCommissionCents,
  pickBudgetApprovedRule,
} from './budget-approved-commission.math';

export type AccrueOnBudgetApprovedInput = {
  storeId: string;
  patientId: string;
  budgetId: string;
  finalValueCents: number;
  responsibleId: string;
  responsibleName: string;
  description: string;
  approvedAt: Date;
};

@Injectable()
export class AccrueCommissionsOnBudgetApprovedService {
  private readonly logger = new Logger(
    AccrueCommissionsOnBudgetApprovedService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleRepository: CommissionRuleRepository,
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly createCommissionAccrual: CreateCommissionAccrualUseCase,
  ) {}

  /**
   * Gera accrual `budget_approved` para o responsável do orçamento.
   * Idempotente por `sourceBudgetId`.
   */
  async execute(input: AccrueOnBudgetApprovedInput): Promise<void> {
    if (!input.responsibleId.trim()) return;
    if (input.finalValueCents <= 0) return;

    const existing = await this.accrualRepository.findBySourceBudgetId(
      input.storeId,
      input.budgetId,
    );
    if (existing.length > 0) return;

    try {
      const rules = await this.ruleRepository.findByMember(
        input.storeId,
        input.responsibleId,
      );
      const rule = pickBudgetApprovedRule(rules);
      if (!rule) return;

      const commissionCents = calculateBudgetApprovedCommissionCents(
        rule,
        input.finalValueCents,
      );
      if (commissionCents <= 0) return;

      const patientName = await this.resolvePatientName(
        input.storeId,
        input.patientId,
      );
      const treatmentName =
        input.description.trim() || 'Orçamento';

      await this.createCommissionAccrual.execute({
        storeId: input.storeId,
        memberId: input.responsibleId,
        memberName:
          rule.memberName.trim() ||
          input.responsibleName.trim() ||
          'Profissional',
        ruleId: rule.id,
        paymentTrigger: 'budget_approved',
        planName: '',
        specialtyName: '',
        treatmentName,
        patientName,
        paidValueCents: input.finalValueCents,
        treatmentCostCents: 0,
        installment: null,
        commissionCents,
        accruedAt: toIsoDateOnly(input.approvedAt),
        sourceBudgetId: input.budgetId,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gerar comissão budget_approved para budget ${input.budgetId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
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
