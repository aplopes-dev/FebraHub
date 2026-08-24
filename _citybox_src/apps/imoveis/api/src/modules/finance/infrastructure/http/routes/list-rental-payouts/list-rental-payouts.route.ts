import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListRentalPayoutsUseCase } from '../../../../application/use-cases/list-rental-payouts/list-rental-payouts.use-case';
import { ListRentalPayoutsPresenter } from './list-rental-payouts.presenter';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class ListRentalPayoutsRoute {
  constructor(private readonly listRentalPayouts: ListRentalPayoutsUseCase) {}

  @Get('rental-payouts')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Finance')
  @ApiOperation({ summary: 'Repasses de locação' })
  async handle(@StoreId() storeId: string) {
    const rows = await this.listRentalPayouts.execute({ storeId });
    return ListRentalPayoutsPresenter.toHttp(rows);
  }
}
