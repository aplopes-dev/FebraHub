import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductHTTPDTO {
  @ApiPropertyOptional({
    description: 'Nome do produto / insumo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código SKU ou código de barras interno',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  unitOfMeasure?: string;

  @ApiPropertyOptional({
    description: 'Quantidade atual em estoque',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Quantidade mínima para alerta de estoque baixo',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Custo unitário de aquisição em reais (R$)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Descrição do insumo ou instruções de uso',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status de atividade no estoque',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
