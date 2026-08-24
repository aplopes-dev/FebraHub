import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PAYMENT_TRIGGERS = [
  'treatment_completed',
  'debit_received',
  'budget_approved',
] as const;
const COMMISSION_TYPES = ['percentage', 'fixed_value'] as const;

export class CommissionRuleTreatmentBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  treatmentId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  treatmentValueCents!: number;
}

export class CommissionRuleBodyDto {
  @ApiProperty({ enum: PAYMENT_TRIGGERS })
  @IsIn(PAYMENT_TRIGGERS)
  paymentTrigger!: (typeof PAYMENT_TRIGGERS)[number];

  @ApiProperty({ enum: COMMISSION_TYPES })
  @IsIn(COMMISSION_TYPES)
  commissionType!: (typeof COMMISSION_TYPES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  percentageValue?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  commissionValueCents?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowValueExceedsTreatment?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  planId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  specialtyId?: string | null;

  @ApiPropertyOptional({ type: [CommissionRuleTreatmentBodyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionRuleTreatmentBodyDto)
  treatments?: CommissionRuleTreatmentBodyDto[];
}

export class ReplaceCommissionRulesBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  memberName!: string;

  @ApiProperty({ type: [CommissionRuleBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionRuleBodyDto)
  rules!: CommissionRuleBodyDto[];
}
