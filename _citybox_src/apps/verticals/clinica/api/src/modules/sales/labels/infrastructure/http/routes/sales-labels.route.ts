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
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { RequireAnyPermission, RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { CreateSalesLabelUseCase } from '../../../application/use-cases/create-sales-label/create-sales-label.use-case';
import { DeleteSalesLabelUseCase } from '../../../application/use-cases/delete-sales-label/delete-sales-label.use-case';
import { ListSalesLabelsUseCase } from '../../../application/use-cases/list-sales-labels/list-sales-labels.use-case';
import { UpdateSalesLabelUseCase } from '../../../application/use-cases/update-sales-label/update-sales-label.use-case';
import type { SalesLabel } from '../../../domain/entities/sales-label.entity';

class ListSalesLabelsQueryDto {
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

class CreateSalesLabelBodyDto {
  @MinLength(1)
  @MaxLength(80)
  @IsString()
  name!: string;

  @Matches(/^#[0-9A-Fa-f]{6}$/)
  @IsString()
  color!: string;
}

class UpdateSalesLabelBodyDto {
  @IsOptional()
  @MinLength(1)
  @MaxLength(80)
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  @IsString()
  color?: string;
}

function toLabelResponse(label: SalesLabel) {
  return {
    id: label.id,
    storeId: label.storeId,
    name: label.name,
    color: label.color,
    createdAt: label.createdAt.toISOString(),
    updatedAt: label.updatedAt.toISOString(),
  };
}

@ApiTags('sales-labels')
@Controller('v1/labels')
export class SalesLabelsRoute {
  constructor(
    private readonly listLabels: ListSalesLabelsUseCase,
    private readonly createLabel: CreateSalesLabelUseCase,
    private readonly updateLabel: UpdateSalesLabelUseCase,
    private readonly deleteLabel: DeleteSalesLabelUseCase,
  ) {}

  @Get()
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Listar rótulos de vendas' })
  async list(
    @StoreId() storeId: string,
    @Query() query: ListSalesLabelsQueryDto,
  ) {
    const result = await this.listLabels.execute({
      storeId,
      page: query.page,
      perPage: query.perPage ?? 50,
    });

    return {
      data: result.items.map(toLabelResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar rótulo de vendas' })
  async create(
    @StoreId() storeId: string,
    @Body() body: CreateSalesLabelBodyDto,
  ) {
    const label = await this.createLabel.execute({
      storeId,
      name: body.name,
      color: body.color,
    });
    return { data: toLabelResponse(label) };
  }

  @Patch(':id')
  @RequirePermission('manage', 'Sales')
  @ApiOperation({ summary: 'Atualizar rótulo de vendas' })
  async update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateSalesLabelBodyDto,
  ) {
    const label = await this.updateLabel.execute({
      storeId,
      id,
      name: body.name,
      color: body.color,
    });
    return { data: toLabelResponse(label) };
  }

  @Delete(':id')
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir rótulo de vendas' })
  async remove(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteLabel.execute({ storeId, id });
  }
}
