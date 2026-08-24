import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialEntriesUseCase } from '../../../../application/use-cases/list-financial-entries/list-financial-entries.use-case';
import { ChartOfAccountRepository } from '../../../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListFinancialEntriesQueryDto } from '../shared/financial-entry.dto';
import { FinancialEntryPresenter } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class ListFinancialEntriesRoute {
  constructor(
    private readonly listFinancialEntries: ListFinancialEntriesUseCase,
    private readonly chartOfAccountRepository: ChartOfAccountRepository,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar lançamentos financeiros',
    description:
      '`dueFrom`/`dueTo` recortam pelo vencimento; `competenceFrom`/`competenceTo` recortam pela competência (eixo alternativo, extrato). `tabCounts` conta o cadastro inteiro da organização, ignorando os filtros.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListFinancialEntriesQueryDto,
  ) {
    const result = await this.listFinancialEntries.execute({
      organizationId,
      operation: query.operation,
      status: query.status,
      chartOfAccountId: query.chartOfAccountId,
      costCenterId: query.costCenterId,
      bankAccountId: query.bankAccountId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
      dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
      competenceFrom: query.competenceFrom
        ? new Date(query.competenceFrom)
        : undefined,
      competenceTo: query.competenceTo
        ? new Date(query.competenceTo)
        : undefined,
      sort: query.sort,
      page: query.page,
      perPage: query.perPage,
    });

    const categoryLabels = await this.resolveCategoryLabels(
      organizationId,
      result.items.flatMap((item) =>
        item.allocations.length === 1
          ? [item.allocations[0].chartOfAccountId]
          : [],
      ),
    );

    return FinancialEntryPresenter.toHttpList(result, categoryLabels);
  }

  /**
   * Um `findById` por id distinto (não por lançamento) — evita N chamadas
   * repetidas quando vários lançamentos da página compartilham a mesma
   * categoria.
   */
  private async resolveCategoryLabels(
    organizationId: string,
    chartOfAccountIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(chartOfAccountIds)];
    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        const account = await this.chartOfAccountRepository.findById(
          organizationId,
          id,
        );
        return [id, account?.name ?? null] as const;
      }),
    );

    return new Map(
      entries.filter((entry): entry is [string, string] => entry[1] !== null),
    );
  }
}
