import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindStoreByIdUseCase } from '../../../../application/use-cases/find-store-by-id/find-store-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FindStoreByIdPresenter } from './find-store-by-id.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class FindStoreByIdRoute {
  constructor(private readonly findStoreById: FindStoreByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar loja por ID' })
  async handle(@Param('id') id: string) {
    const result = await this.findStoreById.execute({ id });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      result.subscription,
      result.invoices,
      result.teamSource,
    );
  }
}
