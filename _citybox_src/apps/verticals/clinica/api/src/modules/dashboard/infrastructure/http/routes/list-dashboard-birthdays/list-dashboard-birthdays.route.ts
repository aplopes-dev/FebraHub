import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardBirthdaysUseCase } from '../../../../application/use-cases/list-dashboard-birthdays/list-dashboard-birthdays.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardBirthdaysQueryDto } from './list-dashboard-birthdays.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardBirthdaysRoute {
  constructor(
    private readonly listDashboardBirthdays: ListDashboardBirthdaysUseCase,
  ) {}

  @Get('birthdays')
  @ApiOperation({
    summary:
      'Listar aniversariantes do dashboard (ativos, período, busca e paginação server-side)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardBirthdaysQueryDto,
  ) {
    const result = await this.listDashboardBirthdays.execute({
      storeId,
      ...query,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
