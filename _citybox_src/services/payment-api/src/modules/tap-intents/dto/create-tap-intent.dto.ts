import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ChargeCustomerDto } from '../../charges/dto/create-charge.dto.js';

export class CreateTapIntentDto {
  @IsString()
  sourceSystem!: string;

  @IsString()
  externalReference!: string;

  @IsString()
  merchantId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @ValidateNested()
  @Type(() => ChargeCustomerDto)
  customer!: ChargeCustomerDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
