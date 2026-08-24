import { Injectable } from '@nestjs/common';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import { EnsureDefaultSalesFunnelsUseCase } from '../../../../sales/funnels/application/use-cases/ensure-default-sales-funnels/ensure-default-sales-funnels.use-case';
import { SalesFunnelRepository } from '../../../../sales/funnels/domain/repositories/sales-funnel.repository';
import type { SalesFunnel } from '../../../../sales/funnels/domain/entities/sales-funnel.entity';
import type { SalesFunnelStageProps } from '../../../../sales/funnels/domain/sales-funnel.types';
import { CreateSalesOpportunityUseCase } from '../../../../sales/opportunities/application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { SalesOpportunityHistory } from '../../../../sales/opportunities/domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityRepository } from '../../../../sales/opportunities/domain/repositories/sales-opportunity.repository';

const SALE_FUNNEL_NAME = 'Funil de Venda';
const SALE_FUNNEL_WON_NAME = 'Ganha';
const OPEN_STAGE_NAME = 'Em aberto';

export type SyncBudgetOpportunityCreatedInput = {
  storeId: string;
  budgetId: string;
  patientId: string;
  description?: string;
};

export type SyncBudgetOpportunityStatusInput = {
  storeId: string;
  budgetId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
};

@Injectable()
export class SyncBudgetSalesOpportunityService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly funnelRepository: SalesFunnelRepository,
    private readonly ensureDefaults: EnsureDefaultSalesFunnelsUseCase,
    private readonly createOpportunity: CreateSalesOpportunityUseCase,
    private readonly opportunities: SalesOpportunityRepository,
  ) {}

  async onCreated(input: SyncBudgetOpportunityCreatedInput): Promise<void> {
    const existing = await this.opportunities.findByBudgetId(
      input.storeId,
      input.budgetId,
    );
    if (existing) return;

    const detail = await this.patientRepository.findById(
      input.storeId,
      input.patientId,
    );
    if (!detail) {
      throw new ValidatorDomainError({
        internalMessage: `Patient not found for budget opportunity sync: ${input.patientId}`,
        externalMessage: 'Paciente não encontrado',
        context: SyncBudgetSalesOpportunityService.name,
      });
    }

    const funnel = await this.resolveSaleFunnel(input.storeId);
    const openStage = this.resolveOpenStage(funnel);

    await this.createOpportunity.execute({
      storeId: input.storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
      title: detail.patient.name.trim() || 'Paciente',
      description: input.description?.trim() || undefined,
      phone: detail.patient.phone || undefined,
      origin: 'budget',
      patientId: input.patientId,
      budgetId: input.budgetId,
      asSystem: true,
      systemName: 'Orçamento',
    });
  }

  async onStatusChanged(input: SyncBudgetOpportunityStatusInput): Promise<void> {
    const opportunity = await this.opportunities.findByBudgetId(
      input.storeId,
      input.budgetId,
    );
    if (!opportunity) return;

    const funnel = await this.funnelRepository.findById(
      input.storeId,
      opportunity.funnelId,
    );
    if (!funnel) {
      throw new ValidatorDomainError({
        internalMessage: `Funnel missing for budget opportunity ${opportunity.id}`,
        externalMessage: 'Funil de venda não encontrado',
        context: SyncBudgetSalesOpportunityService.name,
      });
    }

    const targetStage = this.resolveStageForBudgetStatus(funnel, input.status);
    if (!targetStage || targetStage.id === opportunity.stageId) return;

    const fromStage = funnel.findStage(opportunity.stageId);
    const sortOrder = await this.opportunities.nextSortOrder(
      input.storeId,
      targetStage.id,
    );

    const updated = opportunity.withUpdate({
      stageId: targetStage.id,
      sortOrder,
      stageType: targetStage.type,
    });

    const history = SalesOpportunityHistory.create({
      storeId: input.storeId,
      opportunityId: opportunity.id,
      actionType: 'moved',
      userId: null,
      userName: null,
      isSystemAction: true,
      systemName: 'Orçamento',
      metadata: {
        fromColumn: fromStage?.name ?? opportunity.stageId,
        toColumn: targetStage.name,
        budgetStatus: input.status,
      },
    });

    await this.opportunities.save(updated, [history]);
  }

  async onDeleted(storeId: string, budgetId: string): Promise<void> {
    const opportunity = await this.opportunities.findByBudgetId(
      storeId,
      budgetId,
    );
    if (!opportunity) return;
    if (opportunity.isTerminal) return;
    await this.opportunities.delete(storeId, opportunity.id);
  }

  private async resolveSaleFunnel(storeId: string): Promise<SalesFunnel> {
    await this.ensureDefaults.execute({ storeId });

    const defaults = await this.funnelRepository.listDefaults(storeId);
    const byName = defaults.find((f) => f.name === SALE_FUNNEL_NAME);
    if (byName) {
      const funnel = await this.funnelRepository.findById(storeId, byName.id);
      if (funnel) return funnel;
    }

    for (const item of defaults) {
      const funnel = await this.funnelRepository.findById(storeId, item.id);
      if (!funnel) continue;
      const won = funnel.stages.find((s) => s.type === 'won');
      if (won?.name === SALE_FUNNEL_WON_NAME) return funnel;
    }

    throw new ValidatorDomainError({
      internalMessage: `Sale funnel not found for store ${storeId}`,
      externalMessage:
        'Funil de Venda não encontrado. Abra /vendas para provisionar os funis.',
      context: SyncBudgetSalesOpportunityService.name,
    });
  }

  private resolveOpenStage(funnel: SalesFunnel): SalesFunnelStageProps {
    const others = funnel.stages
      .filter((s) => s.type === 'others')
      .sort((a, b) => a.order - b.order);
    const byName = others.find((s) => s.name === OPEN_STAGE_NAME);
    const stage = byName ?? others[0];
    if (!stage) {
      throw new ValidatorDomainError({
        internalMessage: `Open stage missing on funnel ${funnel.id}`,
        externalMessage: 'Etapa Em aberto não encontrada no Funil de Venda',
        context: SyncBudgetSalesOpportunityService.name,
      });
    }
    return stage;
  }

  private resolveStageForBudgetStatus(
    funnel: SalesFunnel,
    status: SyncBudgetOpportunityStatusInput['status'],
  ): SalesFunnelStageProps | null {
    if (status === 'approved') {
      return funnel.stages.find((s) => s.type === 'won') ?? null;
    }
    if (status === 'rejected' || status === 'expired') {
      return funnel.stages.find((s) => s.type === 'lost') ?? null;
    }
    return this.resolveOpenStage(funnel);
  }
}
