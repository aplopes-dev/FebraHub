import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const DEAL_TYPES = ['SALE', 'RENTAL'] as const;
const DEAL_STATUSES = ['active', 'won', 'cancelled'] as const;
const DEAL_STAGES = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
] as const;

export class UpdateDealDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  propertyId?: string | null;

  @ApiPropertyOptional({ enum: DEAL_TYPES, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(DEAL_TYPES)
  type?: (typeof DEAL_TYPES)[number] | null;

  @ApiPropertyOptional({ enum: DEAL_STATUSES })
  @IsOptional()
  @IsIn(DEAL_STATUSES)
  status?: (typeof DEAL_STATUSES)[number];

  @ApiPropertyOptional({ enum: DEAL_STAGES })
  @IsOptional()
  @IsIn(DEAL_STAGES)
  stage?: (typeof DEAL_STAGES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  agentId?: string | null;
}
