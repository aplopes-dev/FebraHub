import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { PutCommissionConfigUseCase } from '../../../../application/use-cases/put-commission-config/put-commission-config.use-case';
import { PutCommissionConfigDto } from './put-commission-config.dto';
import { PutCommissionConfigPresenter } from './put-commission-config.presenter';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class PutCommissionConfigRoute {
  constructor(
    private readonly putCommissionConfig: PutCommissionConfigUseCase,
  ) {}

  @Put('commission-config')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Finance')
  @ApiOperation({ summary: 'Salvar configuração de comissão da loja' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: PutCommissionConfigDto,
  ) {
    const config = await this.putCommissionConfig.execute({
      storeId,
      global: dto.global,
      agentOverrides: dto.agentOverrides,
    });
    return PutCommissionConfigPresenter.toHttp(config);
  }
}
