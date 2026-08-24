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
import { OrganizationId } from '../../../../shared/infra/http/decorators/tenant.decorators';
import { SalesContractsService } from '../application/sales-contracts.service';
import {
  ListSalesContractsQueryDto,
  SalesContractWritableHttpDto,
} from './dto';

@ApiTags('sales-contracts')
@Controller('v1/sales-contracts')
export class SalesContractsController {
  constructor(private readonly salesContracts: SalesContractsService) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar contratos de venda' })
  list(
    @OrganizationId() organizationId: string,
    @Query() query: ListSalesContractsQueryDto,
  ) {
    return this.salesContracts.list(organizationId, {
      search: query.search,
      statusId: query.statusId,
      page: query.page,
      perPage: query.perPage,
    });
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar contrato de venda' })
  findById(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesContracts.findById(organizationId, id);
  }

  @Post()
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Registrar contrato de venda',
    description:
      'Gera as parcelas automaticamente a partir da duração/frequência.',
  })
  create(
    @OrganizationId() organizationId: string,
    @Body() dto: SalesContractWritableHttpDto,
  ) {
    return this.salesContracts.create(organizationId, dto);
  }

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Atualizar contrato de venda',
    description:
      'Regenera as parcelas se nenhuma ainda tiver saído do estado "open".',
  })
  update(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SalesContractWritableHttpDto,
  ) {
    return this.salesContracts.update(organizationId, id, dto);
  }
}
