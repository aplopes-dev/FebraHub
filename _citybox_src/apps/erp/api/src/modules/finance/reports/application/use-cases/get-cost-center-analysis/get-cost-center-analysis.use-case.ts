import { Injectable } from '@nestjs/common';
import { FinanceReportRepository } from '../../../domain/repositories/finance-report.repository.interface';
import { InvalidReportPeriodError } from '../../../domain/errors/invalid-report-period.error';
import { CostCenterRepository } from '../../../../cost-centers/domain/repositories/cost-center.repository.interface';
import type { CostCenter } from '../../../../cost-centers/domain/entities/cost-center.entity';
import type {
  CostCenterAnalysisItemDto,
  CostCenterAnalysisReportDto,
  GetCostCenterAnalysisInput,
} from '../../dtos/cost-center-analysis-report.dto';

const OUTROS_LABEL = 'Outros';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Análise por centro de custo — agrega `FinancialEntryAllocation` por
 * `costCenterId`, filtrando `FinancialEntry.operation` conforme `type`
 * (`despesa` → `payable`, `receita` → `receivable` — `research.md` D5).
 * Um centro de custo que não resolve para nenhum `CostCenter` conhecido
 * (hoje inatingível no fluxo normal — `costCenterId` é obrigatório desde
 * `001-financial-entries`) cai no bucket defensivo "Outros" — `research.md` D6.
 */
@Injectable()
export class GetCostCenterAnalysisUseCase {
  constructor(
    private readonly financeReportRepository: FinanceReportRepository,
    private readonly costCenterRepository: CostCenterRepository,
  ) {}

  async execute(
    input: GetCostCenterAnalysisInput,
  ): Promise<CostCenterAnalysisReportDto> {
    const { organizationId, from, to, type } = input;
    if (to.getTime() < from.getTime()) {
      throw new InvalidReportPeriodError(toIsoDate(from), toIsoDate(to));
    }

    const operation = type === 'despesa' ? 'payable' : 'receivable';
    const costCentersMap = await this.loadCostCenters(organizationId);
    const sums = await this.financeReportRepository.sumAllocationsByCostCenter(
      organizationId,
      from,
      to,
      operation,
    );

    const items: CostCenterAnalysisItemDto[] = [];
    let outrosValueCents = 0;
    let outrosEntryCount = 0;

    for (const [costCenterId, aggregate] of sums) {
      const costCenter = costCentersMap.get(costCenterId);
      if (costCenter) {
        items.push({
          costCenterId: costCenter.id,
          costCenterName: costCenter.name,
          valueCents: aggregate.totalCents,
          share: 0, // preenchido após somar o total, abaixo
          entryCount: aggregate.entryCount,
        });
      } else {
        outrosValueCents += aggregate.totalCents;
        outrosEntryCount += aggregate.entryCount;
      }
    }

    if (outrosValueCents > 0 || outrosEntryCount > 0) {
      items.push({
        costCenterId: null,
        costCenterName: OUTROS_LABEL,
        valueCents: outrosValueCents,
        share: 0,
        entryCount: outrosEntryCount,
      });
    }

    const totalCents = items.reduce((sum, item) => sum + item.valueCents, 0);
    const itemsWithShare = items
      .map((item) => ({
        ...item,
        share: totalCents > 0 ? item.valueCents / totalCents : 0,
      }))
      .sort((a, b) => b.valueCents - a.valueCents);

    return {
      from: toIsoDate(from),
      to: toIsoDate(to),
      type,
      totalCents,
      items: itemsWithShare,
    };
  }

  private async loadCostCenters(
    organizationId: string,
  ): Promise<Map<string, CostCenter>> {
    const [active, deleted] = await Promise.all([
      this.costCenterRepository.findAll(organizationId, { tab: 'active' }),
      this.costCenterRepository.findAll(organizationId, { tab: 'deleted' }),
    ]);
    return new Map(
      [...active, ...deleted].map((costCenter) => [costCenter.id, costCenter]),
    );
  }
}
