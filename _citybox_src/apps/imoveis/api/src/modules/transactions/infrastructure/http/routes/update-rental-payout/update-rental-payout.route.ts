import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpdateRentalPayoutUseCase } from '../../../../application/use-cases/update-rental-payout/update-rental-payout.use-case';
import { UpdateRentalPayoutDto } from './update-rental-payout.dto';
import { UpdateRentalPayoutPresenter } from './update-rental-payout.presenter';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class UpdateRentalPayoutRoute {
  constructor(private readonly updateRentalPayout: UpdateRentalPayoutUseCase) {}

  @Patch(':id/rental-payout')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Transaction')
  @ApiOperation({ summary: 'Atualizar status de repasse da locação' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRentalPayoutDto,
  ) {
    const transaction = await this.updateRentalPayout.execute({
      storeId,
      id,
      ...dto,
    });
    return UpdateRentalPayoutPresenter.toHttp(transaction);
  }
}
