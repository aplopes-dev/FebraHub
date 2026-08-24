import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DEAL_TYPES = ['SALE', 'RENTAL'] as const;

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  leadId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  propertyId?: string;

  @ApiPropertyOptional({ enum: DEAL_TYPES })
  @IsOptional()
  @IsIn(DEAL_TYPES)
  type?: (typeof DEAL_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string;
}
