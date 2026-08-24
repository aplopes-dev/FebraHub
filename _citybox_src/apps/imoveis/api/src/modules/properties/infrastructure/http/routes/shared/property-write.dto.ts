import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PROPERTY_STATUSES = [
  'available',
  'occupied',
  'sold-out',
  'reserved',
] as const;

const PROPERTY_TYPES = [
  'house',
  'apartment',
  'villa',
  'land',
  'commercial',
] as const;

const LISTING_TYPES = ['sale', 'rent'] as const;

export class PropertyActiveLeadDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  initials!: string;
}

/** Payload HTTP de create/update de imóvel (class-validator + Swagger). */
export class PropertyWriteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ enum: PROPERTY_TYPES })
  @IsIn(PROPERTY_TYPES)
  type!: (typeof PROPERTY_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  units?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  views?: number;

  @ApiProperty({ enum: PROPERTY_STATUSES })
  @IsIn(PROPERTY_STATUSES)
  status!: (typeof PROPERTY_STATUSES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  occupiedUnits?: number | null;

  @ApiProperty({ enum: LISTING_TYPES })
  @IsIn(LISTING_TYPES)
  listingType!: (typeof LISTING_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  floors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeSqm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearBuilt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mapCoordinate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  typeCode?: string | null;

  @ApiPropertyOptional({
    description: 'Texto do catálogo — seção Sobre o imóvel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Diferenciais exibidos no catálogo público',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  highlights?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  totalActiveLeads?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  agentId?: string | null;

  @ApiPropertyOptional({ type: [PropertyActiveLeadDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyActiveLeadDto)
  activeLeads?: PropertyActiveLeadDto[];
}
