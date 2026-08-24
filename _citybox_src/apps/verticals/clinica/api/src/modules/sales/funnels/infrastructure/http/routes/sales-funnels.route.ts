import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { filterVisibleSalesFunnels } from '@citybox/clinica-permissions';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  RequireAnyPermission,
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertCanViewSalesFunnel } from '../../../../shared/infra/assert-sales-funnel-visibility';

import { CreateSalesFunnelUseCase } from '../../../application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { DeleteSalesFunnelUseCase } from '../../../application/use-cases/delete-sales-funnel/delete-sales-funnel.use-case';
import { EnsureDefaultSalesFunnelsUseCase } from '../../../application/use-cases/ensure-default-sales-funnels/ensure-default-sales-funnels.use-case';
import { GetSalesFunnelUseCase } from '../../../application/use-cases/get-sales-funnel/get-sales-funnel.use-case';
import { ListSalesFunnelsUseCase } from '../../../application/use-cases/list-sales-funnels/list-sales-funnels.use-case';
import { UpdateSalesFunnelUseCase } from '../../../application/use-cases/update-sales-funnel/update-sales-funnel.use-case';
import type { SalesFunnel } from '../../../domain/entities/sales-funnel.entity';
import type { SalesFunnelStageType } from '../../../domain/sales-funnel.types';

class ListSalesFunnelsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

class FunnelStageBodyDto {
  @IsOptional()
  @IsString()
  id?: string;

  @MinLength(1)
  @MaxLength(80)
  @IsString()
  name!: string;

  @IsIn(['others', 'won', 'lost'])
  type!: SalesFunnelStageType;

  @Matches(/^#[0-9A-Fa-f]{6}$/)
  @IsString()
  color!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

class CreateSalesFunnelBodyDto {
  @MinLength(1)
  @MaxLength(120)
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunnelStageBodyDto)
  stages?: FunnelStageBodyDto[];
}

class UpdateSalesFunnelBodyDto {
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunnelStageBodyDto)
  stages?: FunnelStageBodyDto[];
}

function toFunnelResponse(funnel: SalesFunnel) {
  return {
    id: funnel.id,
    storeId: funnel.storeId,
    name: funnel.name,
    isDefault: funnel.isDefault,
    createdAt: funnel.createdAt.toISOString(),
    updatedAt: funnel.updatedAt.toISOString(),
    stages: funnel.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      type: stage.type,
      color: stage.color,
      order: stage.order,
      createdAt: stage.createdAt.toISOString(),
      updatedAt: stage.updatedAt.toISOString(),
    })),
  };
}

@ApiTags('sales-funnels')
@Controller('v1/funnels')
export class SalesFunnelsRoute {
  constructor(
    private readonly listFunnels: ListSalesFunnelsUseCase,
    private readonly getFunnel: GetSalesFunnelUseCase,
    private readonly createFunnel: CreateSalesFunnelUseCase,
    private readonly updateFunnel: UpdateSalesFunnelUseCase,
    private readonly deleteFunnel: DeleteSalesFunnelUseCase,
    private readonly ensureDefaults: EnsureDefaultSalesFunnelsUseCase,
  ) {}

  @Get()
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'readScheduleFunnel', subject: 'Sales' },
    { action: 'readSalesFunnel', subject: 'Sales' },
    { action: 'readCustomFunnel', subject: 'Sales' },
    { action: 'readClinicFunnels', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Listar funis de vendas' })
  async list(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Query() query: ListSalesFunnelsQueryDto,
  ) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 50;
    // Carrega página ampla e filtra por checkbox de visualização (poucos funis por loja).
    const result = await this.listFunnels.execute({
      storeId,
      page: 1,
      perPage: 100,
    });
    const visible = filterVisibleSalesFunnels(
      result.items,
      user.permissions ?? [],
    );
    const total = visible.length;
    const start = (page - 1) * perPage;
    const pageItems = visible.slice(start, start + perPage);
    return {
      data: pageItems.map(toFunnelResponse),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  @Post('ensure-defaults')
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Garantir funis padrão da loja' })
  async ensure(@StoreId() storeId: string) {
    return this.ensureDefaults.execute({ storeId });
  }

  @Get(':id')
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'readScheduleFunnel', subject: 'Sales' },
    { action: 'readSalesFunnel', subject: 'Sales' },
    { action: 'readCustomFunnel', subject: 'Sales' },
    { action: 'readClinicFunnels', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Buscar funil por id' })
  async findOne(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') id: string,
  ) {
    const funnel = await this.getFunnel.execute({ storeId, id });
    assertCanViewSalesFunnel(funnel, user);
    return { data: toFunnelResponse(funnel) };
  }

  @Post()
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar funil' })
  async create(
    @StoreId() storeId: string,
    @Body() body: CreateSalesFunnelBodyDto,
  ) {
    const funnel = await this.createFunnel.execute({
      storeId,
      name: body.name,
      stages: body.stages,
    });
    return { data: toFunnelResponse(funnel) };
  }

  @Patch(':id')
  @RequirePermission('manage', 'Sales')
  @ApiOperation({ summary: 'Atualizar funil' })
  async update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateSalesFunnelBodyDto,
  ) {
    const funnel = await this.updateFunnel.execute({
      storeId,
      id,
      name: body.name,
      stages: body.stages,
    });
    return { data: toFunnelResponse(funnel) };
  }

  @Delete(':id')
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir funil' })
  async remove(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteFunnel.execute({ storeId, id });
  }
}
