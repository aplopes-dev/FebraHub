import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AdjustStockBatchItemDTO {
  @ApiProperty({
    description: 'ID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Tipo de movimentação: IN (entrada) ou OUT (saída)',
    example: 'IN',
    enum: ['IN', 'OUT'],
  })
  @IsIn(['IN', 'OUT'])
  type: 'IN' | 'OUT';

  @ApiProperty({
    description: 'Quantidade inteira a ser movimentada (maior que zero)',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Observação ou motivo da movimentação em lote',
    example: 'Entrada em lote no estoque',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdjustStockBatchHTTPDTO {
  @ApiProperty({
    description: 'Lista de movimentações de estoque a serem aplicadas',
    type: [AdjustStockBatchItemDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustStockBatchItemDTO)
  items: AdjustStockBatchItemDTO[];
}
