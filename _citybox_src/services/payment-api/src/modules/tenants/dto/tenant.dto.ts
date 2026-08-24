import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TenantStatus } from '../../../generated/prisma/enums.js';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
