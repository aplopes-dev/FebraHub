import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CheckoutCustomerDto } from './checkout-customer.dto.js';

export class CreateCheckoutDto {
  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer!: CheckoutCustomerDto;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paymentMethods!: string[];

  @IsOptional()
  @IsString()
  description?: string;

  /** Percentual da loja no split (ex.: 95 → plataforma fica com 5%). */
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(99.99)
  storeSharePercent?: number;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  routingStrategy?: string;
}
