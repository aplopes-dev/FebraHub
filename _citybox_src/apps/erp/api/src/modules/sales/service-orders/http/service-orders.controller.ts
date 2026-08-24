import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../shared/infra/tenancy/tenant-context';
import { ServiceOrdersService } from '../application/service-orders.service';
import {
  GenerateSaleHttpDto,
  ListServiceOrdersQueryDto,
  ServiceOrderWritableHttpDto,
} from './dto';

@ApiTags('service-orders')
@Controller('v1/service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrders: ServiceOrdersService) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar ordens de serviço' })
  list(
    @OrganizationId() organizationId: string,
    @Query() query: ListServiceOrdersQueryDto,
  ) {
    return this.serviceOrders.list(organizationId, {
      search: query.search,
      statusId: query.statusId,
      page: query.page,
      perPage: query.perPage,
    });
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar ordem de serviço' })
  findById(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceOrders.findById(organizationId, id);
  }

  @Post()
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Registrar ordem de serviço' })
  create(
    @OrganizationId() organizationId: string,
    @Body() dto: ServiceOrderWritableHttpDto,
  ) {
    return this.serviceOrders.create(organizationId, dto);
  }

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  update(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ServiceOrderWritableHttpDto,
  ) {
    return this.serviceOrders.update(organizationId, id, dto);
  }

  @Post(':id/generate-sale')
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Gerar pedido de venda a partir da OS',
    description:
      'Cria um SaleOrder fechado com as linhas de `payloadJson.lines` e grava `generatedSaleId` na OS. Idempotente.',
  })
  async generateSale(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateSaleHttpDto,
  ) {
    const saleOrder = await this.serviceOrders.generateSale(
      organizationId,
      id,
      actor.userId,
      actor.name ?? 'Usuário',
      dto.payments,
    );
    return {
      data: {
        saleOrderId: saleOrder.id,
        saleOrderNumber: saleOrder.number,
        totalCents: saleOrder.totalCents,
      },
    };
  }
}
