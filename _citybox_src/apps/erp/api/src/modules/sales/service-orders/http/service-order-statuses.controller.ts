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
import { ServiceOrderStatusesService } from '../application/service-order-statuses.service';
import { ServiceOrderStatusWritableHttpDto } from './dto';

@ApiTags('service-orders')
@Controller('v1/service-order-statuses')
export class ServiceOrderStatusesController {
  constructor(private readonly statuses: ServiceOrderStatusesService) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar status de OS' })
  list(@OrganizationId() organizationId: string) {
    return this.statuses.list(organizationId);
  }

  @Post()
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Criar status de OS' })
  create(
    @OrganizationId() organizationId: string,
    @Body() dto: ServiceOrderStatusWritableHttpDto,
  ) {
    return this.statuses.create(organizationId, dto);
  }

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Atualizar status de OS' })
  update(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ServiceOrderStatusWritableHttpDto,
  ) {
    return this.statuses.update(organizationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Excluir status de OS' })
  async delete(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.statuses.delete(organizationId, id);
  }
}
