import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDashboardSummaryQueryDto {
  @ApiPropertyOptional({
    description:
      'Período do filtro (hoje, esta-semana, este-mes, este-semestre, data-especifica)',
    example: 'este-mes',
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: 'Data de início em formato YYYY-MM-DD (para data-especifica)',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim em formato YYYY-MM-DD (para data-especifica)',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
