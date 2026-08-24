import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListGlobalAuditUseCase } from '../../../../application/use-cases/list-global-audit/list-global-audit.use-case';
import { ListGlobalAuditQueryDto } from './list-global-audit.query';

@ApiTags('platform')
@Controller('v1/platform/audit')
@RequirePermission('platform.admin')
export class ListGlobalAuditRoute {
  constructor(private readonly useCase: ListGlobalAuditUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos de auditoria global da plataforma' })
  async handle(@Query() query: ListGlobalAuditQueryDto) {
    return this.useCase.execute(query);
  }
}
