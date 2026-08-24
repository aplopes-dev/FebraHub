import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn } from 'class-validator';

export class GetCostCenterAnalysisQueryDto {
  @ApiProperty({
    example: '2026-08-01',
    description: 'Início do período de competência',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: '2026-08-31',
    description: 'Fim do período de competência',
  })
  @IsDateString()
  to!: string;

  @ApiProperty({ enum: ['despesa', 'receita'] })
  @IsIn(['despesa', 'receita'])
  type!: 'despesa' | 'receita';
}
