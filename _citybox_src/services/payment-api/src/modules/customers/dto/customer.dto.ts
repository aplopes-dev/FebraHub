import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EnvironmentType, ProviderType } from '../../../generated/prisma/enums.js';

export class CreateProviderAccountDto {
  @IsEnum(ProviderType)
  provider!: ProviderType;

  @IsEnum(EnvironmentType)
  environment!: EnvironmentType;

  @IsObject()
  credentials!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateProviderAccountDto {
  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class CreateCustomerDto {
  @IsString()
  merchantId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

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

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  address?: Record<string, unknown>;
}
