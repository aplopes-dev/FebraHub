import { IsIn, IsInt, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStorePlanDto {
  @ApiProperty({
    description: 'Novo plano — deve pertencer à mesma vertical da loja',
  })
  @IsUUID()
  planId!: string;

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY'] })
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle!: 'MONTHLY' | 'YEARLY';

  @ApiProperty({ description: 'Dia de vencimento da fatura (1-28)' })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay!: number;
}
