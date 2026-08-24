import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SplitRuleDto } from '../../splits/dto/split-rule.dto.js';

export class ChargeCustomerDto {
  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsString()
  name!: string;

  @IsString()
  cpfCnpj!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;
}

export class ChargeItemDto {
  @IsOptional()
  @IsString()
  externalItemId?: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitValue!: number;

  @IsNumber()
  @Min(0)
  totalValue!: number;
}

export class CreateChargeDto {
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
  routingStrategy?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paymentMethods!: string[];

  @ValidateNested()
  @Type(() => ChargeCustomerDto)
  customer!: ChargeCustomerDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChargeItemDto)
  items?: ChargeItemDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitRuleDto)
  splitRules?: SplitRuleDto[];
}
