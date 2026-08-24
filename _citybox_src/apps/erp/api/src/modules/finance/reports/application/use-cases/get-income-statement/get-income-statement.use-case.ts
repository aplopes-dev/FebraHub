import { Injectable } from '@nestjs/common';
import { FinanceReportRepository } from '../../../domain/repositories/finance-report.repository.interface';
import { InvalidReportPeriodError } from '../../../domain/errors/invalid-report-period.error';
import { FinancialGroupRepository } from '../../../../financial-groups/domain/repositories/financial-group.repository.interface';
import { ChartOfAccountRepository } from '../../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import type { ChartOfAccountWithGroup } from '../../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import type {
  GetIncomeStatementInput,
  IncomeStatementAccountDto,
  IncomeStatementGroupDto,
  IncomeStatementReportDto,
} from '../../dtos/income-statement-report.dto';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * DRE reestruturada (spec `007-financeiro-ajustes-ui` US5) — sempre os grupos
 * `classification=resultado` **ativos**, na ordem fixa do catálogo
 * (`FinancialGroup.catalogOrder`), mesmo os que não tiveram nenhum lançamento
 * no período (`totalCents: 0`, nunca omitidos — Edge Case da spec). Antes
 * (`003-financial-reports-cost-center`) só apareciam os grupos com soma, e
 * eram ordenados por valor — comportamento substituído por completo aqui.
 *
 * A agregação pesada continua no banco (`FinanceReportRepository.
 * sumAllocationsByChartOfAccount`); só o cadastro (grupos/contas, tamanho
 * bounded) é carregado inteiro em memória — mesmo padrão de `research.md` D3
 * da 003.
 */
@Injectable()
export class GetIncomeStatementUseCase {
  constructor(
    private readonly financeReportRepository: FinanceReportRepository,
    private readonly financialGroupRepository: FinancialGroupRepository,
    private readonly chartOfAccountRepository: ChartOfAccountRepository,
  ) {}

  async execute(
    input: GetIncomeStatementInput,
  ): Promise<IncomeStatementReportDto> {
    const { organizationId, from, to } = input;
    if (to.getTime() < from.getTime()) {
      throw new InvalidReportPeriodError(toIsoDate(from), toIsoDate(to));
    }

    const [resultGroups, accountsByGroup, sums] = await Promise.all([
      this.loadOrderedResultGroups(organizationId),
      this.loadChartOfAccountsByGroup(organizationId),
      this.financeReportRepository.sumAllocationsByChartOfAccount(
        organizationId,
        from,
        to,
      ),
    ]);

    let entryCount = 0;
    let operatingResultCents = 0;

    const groups: IncomeStatementGroupDto[] = resultGroups.map((group) => {
      const accounts = accountsByGroup.get(group.id) ?? [];

      const accountDtos: IncomeStatementAccountDto[] = accounts.map(
        (account) => {
          const aggregate = sums.get(account.id);
          entryCount += aggregate?.entryCount ?? 0;
          return {
            chartOfAccountId: account.id,
            name: account.name,
            totalCents: aggregate?.totalCents ?? 0,
          };
        },
      );

      const totalCents = accountDtos.reduce(
        (sum, account) => sum + account.totalCents,
        0,
      );

      // `sign` só é `null` para grupo do lojista fora do modelo de 9
      // categorias — não deveria aparecer aqui (filtrado em
      // `loadOrderedResultGroups`), mas o fallback evita um `!` arriscado.
      const sign = group.sign ?? 'positive';
      operatingResultCents += sign === 'positive' ? totalCents : -totalCents;

      return {
        financialGroupId: group.id,
        name: group.name,
        sign,
        totalCents,
        accounts: accountDtos,
      };
    });

    return {
      from: toIsoDate(from),
      to: toIsoDate(to),
      groups,
      operatingResultCents,
      entryCount,
    };
  }

  /** Só os grupos do modelo de 9 categorias (`sign` preenchido pelo seed), ordenados. */
  private async loadOrderedResultGroups(organizationId: string) {
    const groups = await this.financialGroupRepository.findAll(organizationId, {
      tab: 'active',
    });
    return groups
      .filter((group) => group.classification === 'resultado' && group.sign)
      .sort((a, b) => a.catalogOrder - b.catalogOrder);
  }

  private async loadChartOfAccountsByGroup(
    organizationId: string,
  ): Promise<Map<string, ChartOfAccountWithGroup['account'][]>> {
    const active = await this.chartOfAccountRepository.findAll(organizationId, {
      tab: 'active',
    });
    const byGroup = new Map<string, ChartOfAccountWithGroup['account'][]>();
    for (const entry of active) {
      const list = byGroup.get(entry.account.financialGroupId) ?? [];
      list.push(entry.account);
      byGroup.set(entry.account.financialGroupId, list);
    }
    return byGroup;
  }
}
