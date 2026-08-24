import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetInvoicesStatsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of invoice statuses',
  })
  @IsOptional()
  @IsString({ each: true })
  @Type(() => String)
  status?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of payment methods',
  })
  @IsOptional()
  @IsString({ each: true })
  @Type(() => String)
  method?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDateTo?: string;
}
