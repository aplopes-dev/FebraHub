import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommissionSplitPercentsDto {
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
}

export class CommissionGlobalConfigDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionPercent!: number;

  @ApiProperty({ type: CommissionSplitPercentsDto })
  @ValidateNested()
  @Type(() => CommissionSplitPercentsDto)
  defaultSplit!: CommissionSplitPercentsDto;
}

export class AgentCommissionOverrideDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  agentId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  captorPercentOverride!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sellerPercentOverride?: number;
}

export class PutCommissionConfigDto {
  @ApiProperty({ type: CommissionGlobalConfigDto })
  @ValidateNested()
  @Type(() => CommissionGlobalConfigDto)
  global!: CommissionGlobalConfigDto;

  @ApiProperty({ type: [AgentCommissionOverrideDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentCommissionOverrideDto)
  agentOverrides!: AgentCommissionOverrideDto[];
}
