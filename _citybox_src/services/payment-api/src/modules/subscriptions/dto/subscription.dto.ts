import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChargeCustomerDto } from '../../charges/dto/create-charge.dto.js';

export class CreateSubscriptionDto {
  @IsString()
  sourceSystem!: string;

  @IsString()
  externalReference!: string;

  @IsString()
  merchantId!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'])
  billingCycle!: string;

  @IsString()
  paymentMethod!: string;

  @IsString()
  nextDueDate!: string;

  @ValidateNested()
  @Type(() => ChargeCustomerDto)
  customer!: ChargeCustomerDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ResumeSubscriptionDto {
  @IsString()
  nextDueDate!: string;
}
