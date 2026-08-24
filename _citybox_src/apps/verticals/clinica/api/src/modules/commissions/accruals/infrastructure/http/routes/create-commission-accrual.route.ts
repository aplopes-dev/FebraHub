import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCommissionAccrualUseCase } from '../../../application/use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateCommissionAccrualBodyDto } from './commission-accrual.dto';
import { CommissionAccrualPresenter } from './commission-accrual.presenter';

@ApiTags('commissions')
@Controller('v1/commissions/accruals')
@RequirePermission('update', 'FinancialCommission')
export class CreateCommissionAccrualRoute {
  constructor(
    private readonly createCommissionAccrual: CreateCommissionAccrualUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar lançamento de comissão em aberto' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateCommissionAccrualBodyDto,
  ) {
    const accrual = await this.createCommissionAccrual.execute({
      storeId,
      ...dto,
    });
    return CommissionAccrualPresenter.toCreatedHttp(accrual);
  }
}
