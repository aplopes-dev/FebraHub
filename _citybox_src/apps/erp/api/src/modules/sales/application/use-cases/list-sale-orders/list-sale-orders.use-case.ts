import { Inject, Injectable, forwardRef } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import { NfeIssuanceRepository } from '../../../../nfe-issuance/domain/repositories/nfe-issuance.repository.interface';
import type {
  ListSaleOrdersDto,
  ListSaleOrdersResult,
  SaleOrderNfeIssuanceSummary,
} from '../../dtos/sale-order.dto';

@Injectable()
export class ListSaleOrdersUseCase implements IUseCase<
  ListSaleOrdersDto,
  ListSaleOrdersResult
> {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    // `forwardRef`: `nfe-issuance` já depende de `SalesModule` (para ler o
    // pedido na emissão) — esta é a dependência inversa (spec erp/029, listar
    // o vínculo), genuinamente bidirecional entre os dois módulos.
    @Inject(forwardRef(() => NfeIssuanceRepository))
    private readonly nfeIssuanceRepository: NfeIssuanceRepository,
  ) {}

  async execute(input: ListSaleOrdersDto): Promise<ListSaleOrdersResult> {
    const criteria = {
      tab: input.tab,
      search: input.search,
      statuses: input.statuses,
      channelId: input.channelId,
      amountMinCents: input.amountMinCents,
      amountMaxCents: input.amountMaxCents,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      sort: input.sort,
    };

    // Os contadores das abas ignoram os demais filtros de propósito —
    // dizem quanto existe em cada aba, não quanto a busca/filtro achou.
    const [total, tabCounts] = await Promise.all([
      this.saleOrderRepository.count(input.organizationId, criteria),
      this.saleOrderRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.saleOrderRepository.findAll(input.organizationId, {
      ...criteria,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    // spec erp/029 (FR-010): vínculo NF-e por pedido, resolvido em lote — uma
    // consulta pra página inteira, não uma por linha.
    const saleOrderIds = items.map((item) => item.saleOrder.id);
    const nfeIssuances = await this.nfeIssuanceRepository.findBySaleOrderIds(
      input.organizationId,
      saleOrderIds,
    );
    const nfeIssuanceBySaleOrderId = new Map<
      string,
      SaleOrderNfeIssuanceSummary
    >(
      nfeIssuances.map((issuance) => [
        issuance.saleOrderId,
        {
          id: issuance.id,
          status: issuance.status,
          fiscalDocumentId: issuance.fiscalDocumentId,
        },
      ]),
    );
    const itemsWithNfeIssuance = items.map((item) => ({
      ...item,
      nfeIssuance: nfeIssuanceBySaleOrderId.get(item.saleOrder.id) ?? null,
    }));

    return {
      items: itemsWithNfeIssuance,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}
