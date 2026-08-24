import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const SPLIT_SOURCES = ['GLOBAL', 'AGENT_OVERRIDE', 'MANUAL'] as const;

export class CommissionOtherSplitDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent!: number;
}

export class UpdateTransactionSplitDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  agencyPercent!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  captorPercent!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  sellerPercent!: number;

  @ApiPropertyOptional({ type: [CommissionOtherSplitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionOtherSplitDto)
  others?: CommissionOtherSplitDto[];

  @ApiPropertyOptional({ description: 'Ausente mantém a comissão total atual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiPropertyOptional({ enum: SPLIT_SOURCES })
  @IsOptional()
  @IsIn(SPLIT_SOURCES)
  splitSource?: (typeof SPLIT_SOURCES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  actorName!: string;
}
