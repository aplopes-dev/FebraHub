import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MerchantStatus } from '../../../generated/prisma/enums.js';

export class CreateMerchantDto {
  @IsString()
  @MinLength(2)
  legalName!: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsString()
  cpfCnpj!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  address?: Record<string, unknown>;
}

export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  address?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;
}
