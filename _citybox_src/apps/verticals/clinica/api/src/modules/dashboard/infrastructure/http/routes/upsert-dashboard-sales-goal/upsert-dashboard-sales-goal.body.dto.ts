import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertDashboardSalesGoalBodyDto {
  @ApiProperty({ example: 5500000, description: 'Meta em centavos (> 0)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  goalCents!: number;
}
