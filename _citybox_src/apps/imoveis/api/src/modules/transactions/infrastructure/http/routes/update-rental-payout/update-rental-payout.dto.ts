import { IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const RENTAL_PAYOUT_STATUSES = [
  'AWAITING_PAYMENT',
  'PAID_BY_TENANT',
  'READY_FOR_PAYOUT',
  'PAID_TO_LANDLORD',
] as const;

export class UpdateRentalPayoutDto {
  @ApiProperty({ enum: RENTAL_PAYOUT_STATUSES })
  @IsIn(RENTAL_PAYOUT_STATUSES)
  status!: (typeof RENTAL_PAYOUT_STATUSES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  actorName!: string;
}
