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
import { UpdateLeadStatusUseCase } from '../../../../application/use-cases/update-lead-status/update-lead-status.use-case';
import { UpdateLeadStatusDto } from './update-lead-status.dto';
import { UpdateLeadStatusPresenter } from './update-lead-status.presenter';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class UpdateLeadStatusRoute {
  constructor(private readonly updateLeadStatus: UpdateLeadStatusUseCase) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Atualizar status do lead' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    const lead = await this.updateLeadStatus.execute({
      storeId,
      id,
      status: dto.status,
    });
    return UpdateLeadStatusPresenter.toHttp(lead);
  }
}
