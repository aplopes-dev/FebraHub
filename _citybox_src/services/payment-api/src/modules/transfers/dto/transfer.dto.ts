import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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

export class TransferBankAccountDto {
  @IsString()
  bankCode!: string;

  @IsString()
  agency!: string;

  @IsString()
  account!: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  @IsOptional()
  @IsString()
  holderDocument?: string;
}

export class CreateTransferDto {
  @IsString()
  merchantId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransferBankAccountDto)
  bankAccount?: TransferBankAccountDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
