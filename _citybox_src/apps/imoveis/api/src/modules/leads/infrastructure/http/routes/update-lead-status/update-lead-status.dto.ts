import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const LEAD_STATUSES = [
  'new',
  'negotiating',
  'scheduled-visit',
  'closed-won',
  'cancelled',
] as const;

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LEAD_STATUSES })
  @IsIn(LEAD_STATUSES)
  status!: (typeof LEAD_STATUSES)[number];
}
