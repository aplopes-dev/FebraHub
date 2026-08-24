import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetStoreWorkScheduleUseCase } from '../../../../application/use-cases/get-store-work-schedule/get-store-work-schedule.use-case';
import { ReplaceStoreWorkScheduleUseCase } from '../../../../application/use-cases/replace-store-work-schedule/replace-store-work-schedule.use-case';
import {
  StoreWorkSchedulePresenter,
  StoreWorkScheduleResponse,
} from '../../shared/store-work-schedule.presenter';
import { ReplaceStoreWorkScheduleHTTPDTO } from './store-work-schedule.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Settings')
@Controller('v1/settings/store/work-schedule')
export class StoreWorkScheduleRoute {
  constructor(
    private readonly getUseCase: GetStoreWorkScheduleUseCase,
    private readonly replaceUseCase: ReplaceStoreWorkScheduleUseCase,
  ) {}

  @RequirePermission('manage', 'Settings')
  @Get()
  @ApiOperation({
    summary: 'Grade semanal de funcionamento do estabelecimento',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade atual (dia vazio = fechado)',
  })
  async get(@StoreId() storeId: string): Promise<StoreWorkScheduleResponse> {
    const result = await this.getUseCase.execute({ storeId });
    return StoreWorkSchedulePresenter.toHTTP(result);
  }

  @Put()
  @RequirePermission('manage', 'Settings')
  @ApiOperation({
    summary:
      'Substitui a grade semanal de funcionamento do estabelecimento (replace atômico)',
  })
  @ApiResponse({ status: 200, description: 'Grade atualizada' })
  @ApiResponse({ status: 422, description: 'Grade inválida' })
  async replace(
    @StoreId() storeId: string,
    @Body() dto: ReplaceStoreWorkScheduleHTTPDTO,
  ): Promise<StoreWorkScheduleResponse> {
    const result = await this.replaceUseCase.execute({
      storeId,
      week: dto.week,
    });
    return StoreWorkSchedulePresenter.toHTTP(result);
  }
}
