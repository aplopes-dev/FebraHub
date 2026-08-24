import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetBillingKpisQueryDto {
  @ApiPropertyOptional({ description: 'Data de início para filtrar KPIs' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim para filtrar KPIs' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
