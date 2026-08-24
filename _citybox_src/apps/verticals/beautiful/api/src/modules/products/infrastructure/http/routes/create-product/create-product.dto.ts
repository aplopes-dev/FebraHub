import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductHTTPDTO {
  @ApiProperty({
    description: 'Nome do produto / insumo',
    example: 'Shampoo Reconstrução Lavatório 300ml',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Código SKU ou código de barras interno (opcional)',
    example: 'SHP-101',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    description: 'Unidade de medida (ex: un, ml, g, L, kg, frasco)',
    example: 'frasco',
  })
  @IsString()
  @MinLength(1)
  unitOfMeasure: string;

  @ApiProperty({
    description: 'Quantidade atual em estoque',
    example: 18,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({
    description: 'Quantidade mínima para alerta de estoque baixo',
    example: 5,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  minStockQuantity: number;

  @ApiPropertyOptional({
    description: 'Custo unitário de aquisição em reais (R$)',
    example: 42.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Descrição do insumo ou instruções de uso',
    example: 'Insumo de lavatório para tratamentos nutritivos...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status de atividade no estoque',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
