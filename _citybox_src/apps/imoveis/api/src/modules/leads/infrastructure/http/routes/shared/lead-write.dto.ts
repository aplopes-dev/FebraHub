import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LEAD_STATUSES = [
  'new',
  'negotiating',
  'scheduled-visit',
  'closed-won',
  'cancelled',
] as const;

const LEAD_SOURCES = [
  'walk-in',
  'website',
  'referral',
  'social',
  'ads',
  'whatsapp',
] as const;

const PROPERTY_TYPES = [
  'house',
  'apartment',
  'villa',
  'land',
  'commercial',
] as const;

const PURPOSES = ['buying', 'renting', 'selling'] as const;

const PAYMENT_INTENTS = [
  'cash',
  'financing',
  'fgts',
  'trade-in',
] as const;

const ACTIVITY_TYPES = [
  'note',
  'system',
  'status',
  'assignment',
  'document',
  'property',
] as const;

export class LeadMatchedPropertyDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;
}

export class LeadDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  sizeLabel!: string;

  @ApiPropertyOptional({ enum: ['contract', 'other'], default: 'other' })
  @IsOptional()
  @IsIn(['contract', 'other'])
  kind?: 'contract' | 'other';

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsString()
  addedAt!: string;
}

export class LeadActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: ACTIVITY_TYPES })
  @IsIn(ACTIVITY_TYPES)
  type!: (typeof ACTIVITY_TYPES)[number];

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdAt?: string;
}

/** Payload HTTP de create/update de lead (class-validator + Swagger). */
export class LeadWriteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ enum: LEAD_STATUSES })
  @IsIn(LEAD_STATUSES)
  status!: (typeof LEAD_STATUSES)[number];

  @ApiProperty({ enum: LEAD_SOURCES })
  @IsIn(LEAD_SOURCES)
  leadSource!: (typeof LEAD_SOURCES)[number];

  @ApiProperty({ enum: PROPERTY_TYPES })
  @IsIn(PROPERTY_TYPES)
  interestedPropertyType!: (typeof PROPERTY_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  budgetRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiProperty({ enum: PURPOSES })
  @IsIn(PURPOSES)
  purpose!: (typeof PURPOSES)[number];

  @ApiPropertyOptional({
    enum: PAYMENT_INTENTS,
    isArray: true,
    description:
      'Intenção de pagamento (opcional). À vista, financiamento, FGTS ou permuta.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(PAYMENT_INTENTS, { each: true })
  @Type(() => String)
  paymentIntents?: (typeof PAYMENT_INTENTS)[number][];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  latestFollowUp?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  nextFollowUp?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  propertyName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasSuggestion?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  agentId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agentIds?: string[];

  @ApiPropertyOptional({ type: [LeadMatchedPropertyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadMatchedPropertyDto)
  matchedProperties?: LeadMatchedPropertyDto[];

  @ApiPropertyOptional({ type: [LeadDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadDocumentDto)
  documents?: LeadDocumentDto[];

  @ApiPropertyOptional({ type: [LeadActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadActivityDto)
  activities?: LeadActivityDto[];
}
