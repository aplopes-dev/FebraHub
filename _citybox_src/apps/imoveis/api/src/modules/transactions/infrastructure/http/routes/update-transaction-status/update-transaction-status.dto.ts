import { IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const WRITABLE_STATUSES = ['COMPLETED', 'CANCELLED'] as const;

export class UpdateTransactionStatusDto {
  @ApiProperty({ enum: WRITABLE_STATUSES })
  @IsIn(WRITABLE_STATUSES)
  status!: (typeof WRITABLE_STATUSES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  actorName!: string;
}
