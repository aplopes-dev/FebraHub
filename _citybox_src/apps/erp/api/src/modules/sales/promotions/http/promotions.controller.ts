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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../shared/infra/http/decorators/tenant.decorators';
import { PromotionsService } from '../application/promotions.service';
import {
  ListPromotionsQueryDto,
  PreviewPromotionHttpDto,
  PromotionWritableHttpDto,
} from './dto';

@ApiTags('promotions')
@Controller('v1/promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar promoções' })
  list(
    @OrganizationId() organizationId: string,
    @Query() query: ListPromotionsQueryDto,
  ) {
    return this.promotions.list(organizationId, {
      search: query.search,
      type: query.type,
      tab: query.tab,
      page: query.page,
      perPage: query.perPage,
    });
  }

  @Post('preview')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Simular desconto de promoções (stub)',
    description: 'Motor de regras por tipo ainda não implementado — devolve 0.',
  })
  preview(@Body() dto: PreviewPromotionHttpDto) {
    return this.promotions.preview(dto.productIds, dto.quantities);
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar promoção' })
  findById(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promotions.findById(organizationId, id);
  }

  @Post()
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Criar promoção' })
  create(
    @OrganizationId() organizationId: string,
    @Body() dto: PromotionWritableHttpDto,
  ) {
    return this.promotions.create(organizationId, dto);
  }

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Atualizar promoção' })
  update(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PromotionWritableHttpDto,
  ) {
    return this.promotions.update(organizationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Excluir promoção (soft-delete)' })
  async softDelete(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.promotions.softDelete(organizationId, id);
  }

  @Post(':id/restore')
  @RequirePermission('store.sales.manage')
  @ApiOperation({ summary: 'Restaurar promoção excluída' })
  restore(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promotions.restore(organizationId, id);
  }
}
