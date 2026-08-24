import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../shared/infra/http/decorators/tenant.decorators';
import { ContractStatusesService } from '../application/contract-statuses.service';
import { ContractStatusWritableHttpDto } from './dto';

@ApiTags('sales-contracts')
@Controller('v1/contract-statuses')
export class ContractStatusesController {
  constructor(private readonly statuses: ContractStatusesService) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar status de contrato' })
  list(@OrganizationId() organizationId: string) {
    return this.statuses.list(organizationId);
  }

  @Post()
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Criar status de contrato' })
  create(
    @OrganizationId() organizationId: string,
    @Body() dto: ContractStatusWritableHttpDto,
  ) {
    return this.statuses.create(organizationId, dto);
  }

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Atualizar status de contrato' })
  update(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ContractStatusWritableHttpDto,
  ) {
    return this.statuses.update(organizationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Excluir status de contrato' })
  async delete(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.statuses.delete(organizationId, id);
  }
}
