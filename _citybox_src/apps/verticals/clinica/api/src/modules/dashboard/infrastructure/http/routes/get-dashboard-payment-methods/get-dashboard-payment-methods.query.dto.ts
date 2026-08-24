import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDashboardPaymentMethodsQueryDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  endDate!: string;
}
