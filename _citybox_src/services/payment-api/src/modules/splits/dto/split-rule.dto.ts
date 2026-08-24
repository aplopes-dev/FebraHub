import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SplitRuleDto {
  @IsString()
  recipientId!: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  type!: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0.0001)
  value!: number;

  @IsOptional()
  @IsString()
  providerWalletId?: string;

  @IsOptional()
  @IsString()
  recipientExternalReference?: string;
}
