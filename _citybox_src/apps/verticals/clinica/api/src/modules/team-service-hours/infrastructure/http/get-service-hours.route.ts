import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetServiceHoursUseCase } from '../../application/get-service-hours.use-case';
import { RequirePermission } from '../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../shared/infra/http/decorators/store-id.decorator';
import { ServiceHoursPresenter } from './service-hours.presenter';

@ApiTags('team-service-hours')
@Controller('v1/team/:memberId/service-hours')
@RequirePermission('read', 'Team')
export class GetServiceHoursRoute {
  constructor(private readonly getServiceHours: GetServiceHoursUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter horários de atendimento do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
  ) {
    const config = await this.getServiceHours.execute({ storeId, memberId });
    return ServiceHoursPresenter.toHttp(config);
  }
}
