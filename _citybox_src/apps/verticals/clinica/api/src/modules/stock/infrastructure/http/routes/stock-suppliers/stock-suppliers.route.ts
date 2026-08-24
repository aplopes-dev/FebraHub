import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { ListStockSuppliersUseCase } from '../../../../application/use-cases/suppliers/list-stock-suppliers.use-case';
import { CreateStockSupplierUseCase } from '../../../../application/use-cases/suppliers/create-stock-supplier.use-case';
import { UpdateStockSupplierUseCase } from '../../../../application/use-cases/suppliers/update-stock-supplier.use-case';
import { DeleteStockSupplierUseCase } from '../../../../application/use-cases/suppliers/delete-stock-supplier.use-case';

class CreateStockSupplierDto {
  @MinLength(1)
  @MaxLength(120)
  @IsString()
  @ApiPropertyOptional()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;
}

class UpdateStockSupplierDto {
  @MinLength(1)
  @MaxLength(120)
  @IsString()
  @ApiPropertyOptional()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;
}

@ApiTags('stock-suppliers')
@Controller('v1/stock-suppliers')
@RequirePermission('manage', 'Stock')
export class StockSuppliersRoute {
  constructor(
    private readonly listSuppliers: ListStockSuppliersUseCase,
    private readonly createSupplier: CreateStockSupplierUseCase,
    private readonly updateSupplier: UpdateStockSupplierUseCase,
    private readonly deleteSupplier: DeleteStockSupplierUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar fornecedores' })
  async list(@StoreId() storeId: string) {
    const suppliers = await this.listSuppliers.execute({ storeId });
    return {
      data: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar fornecedor' })
  async create(
    @StoreId() storeId: string,
    @Body() dto: CreateStockSupplierDto,
  ) {
    const supplier = await this.createSupplier.execute({
      storeId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });

    return {
      data: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        createdAt: supplier.createdAt.toISOString(),
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  async update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStockSupplierDto,
  ) {
    const supplier = await this.updateSupplier.execute({
      storeId,
      id,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });

    return {
      data: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        createdAt: supplier.createdAt.toISOString(),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir fornecedor' })
  async remove(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteSupplier.execute({ storeId, id });
  }
}
