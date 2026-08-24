import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertServiceHoursUseCase } from '../../application/upsert-service-hours.use-case';
import { RequirePermission } from '../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../shared/infra/http/decorators/store-id.decorator';
import { ServiceHoursBodyDto } from './service-hours.dto';
import { ServiceHoursPresenter } from './service-hours.presenter';

@ApiTags('team-service-hours')
@Controller('v1/team/:memberId/service-hours')
@RequirePermission('update', 'Team')
export class UpsertServiceHoursRoute {
  constructor(private readonly upsertServiceHours: UpsertServiceHoursUseCase) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salvar horários de atendimento do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ServiceHoursBodyDto,
  ) {
    const config = await this.upsertServiceHours.execute({
      storeId,
      memberId,
      config: dto,
    });
    return ServiceHoursPresenter.toHttp(config);
  }
}
