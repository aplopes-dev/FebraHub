import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const DEAL_STAGES = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
] as const;

export class UpdateDealStageDto {
  @ApiProperty({ enum: DEAL_STAGES })
  @IsIn(DEAL_STAGES)
  stage!: (typeof DEAL_STAGES)[number];
}
