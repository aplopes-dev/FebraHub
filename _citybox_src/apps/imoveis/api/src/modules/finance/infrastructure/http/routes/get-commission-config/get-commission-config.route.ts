import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetCommissionConfigUseCase } from '../../../../application/use-cases/get-commission-config/get-commission-config.use-case';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class GetCommissionConfigRoute {
  constructor(private readonly useCase: GetCommissionConfigUseCase) {}

  @Get('commission-config')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Finance')
  @ApiOperation({ summary: 'Obter config de comissão' })
  async handle(@StoreId() storeId: string) {
    const config = await this.useCase.execute({ storeId });
    return {
      data: {
        global: {
          defaultCommissionPercent: config.defaultCommissionPercent,
          defaultSplit: { ...config.defaultSplit },
        },
        agentOverrides: config.agentOverrides.map((o) => ({
          agentId: o.agentId,
          captorPercentOverride: o.captorPercentOverride,
          sellerPercentOverride: o.sellerPercentOverride ?? undefined,
        })),
      },
    };
  }
}
