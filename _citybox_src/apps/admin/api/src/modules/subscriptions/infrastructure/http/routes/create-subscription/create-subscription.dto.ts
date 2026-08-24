import { IsDateString, IsIn, IsInt, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionBodyDto {
  @ApiProperty({ description: 'Loja assinante (unidade de billing).' })
  @IsUUID()
  storeId!: string;

  @ApiProperty()
  @IsUUID()
  planPriceId!: string;

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY'] })
  @IsIn(['MONTHLY', 'YEARLY'])
  cycle!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth!: number;

  @ApiProperty()
  @IsDateString()
  currentPeriodStart!: string;

  @ApiProperty()
  @IsDateString()
  currentPeriodEnd!: string;
}
