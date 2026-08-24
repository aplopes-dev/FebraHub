import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStoreAuditLogUseCase } from '../../../../application/use-cases/list-store-audit-log/list-store-audit-log.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListStoreAuditLogQueryDto } from '../shared/store-detail.dto';
import { parseCsvParam } from '../list-stores/list-stores.query';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class ListStoreAuditLogRoute {
  constructor(private readonly listStoreAuditLog: ListStoreAuditLogUseCase) {}

  @Get(':id/audit-log')
  @ApiOperation({ summary: 'Listar logs de auditoria da loja' })
  async handle(
    @Param('id') storeId: string,
    @Query() query: ListStoreAuditLogQueryDto,
  ) {
    const severity = parseCsvParam(query.severity) as
      | Array<'info' | 'aviso' | 'erro' | 'critico'>
      | undefined;

    const result = await this.listStoreAuditLog.execute({
      storeId,
      page: query.page,
      perPage: query.perPage,
      severity,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    return {
      data: result.items.map((item) => ({
        id: item.id,
        occurredAt: item.occurredAt.toISOString(),
        severity: item.severity,
        actor: item.actor,
        actorRole: item.actorRole ?? undefined,
        module: item.module,
        action: item.action,
        details: item.details ?? undefined,
      })),
      meta: result.meta,
    };
  }
}
