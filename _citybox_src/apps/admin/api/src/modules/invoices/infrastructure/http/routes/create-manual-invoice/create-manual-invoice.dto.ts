import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManualInvoiceBodyDto {
  @ApiProperty({ description: 'ID do loja a ser cobrado' })
  @IsNotEmpty()
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'ID da assinatura do loja', required: false })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ description: 'Valor a cobrar em centavos' })
  @IsNotEmpty()
  @IsInt()
  amountCents: number;

  @ApiProperty({ description: 'Data de início do período (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  periodStart: string;

  @ApiProperty({ description: 'Data de fim do período (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  periodEnd: string;

  @ApiProperty({
    description: 'Observações internas ou descrição da fatura',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
