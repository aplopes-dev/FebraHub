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
import { UpdateDealUseCase } from '../../../../application/use-cases/update-deal/update-deal.use-case';
import { UpdateDealDto } from './update-deal.dto';
import { UpdateDealPresenter } from './update-deal.presenter';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class UpdateDealRoute {
  constructor(private readonly updateDeal: UpdateDealUseCase) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Atualizar negócio CRM' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    const deal = await this.updateDeal.execute({
      storeId,
      id,
      propertyId: dto.propertyId,
      type: dto.type,
      status: dto.status,
      stage: dto.stage,
      title: dto.title,
      agentId: dto.agentId,
    });
    return UpdateDealPresenter.toHttp(deal);
  }
}
