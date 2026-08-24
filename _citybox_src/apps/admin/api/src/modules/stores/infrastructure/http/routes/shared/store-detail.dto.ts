import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateStoreSettingsBodyDto {
  @ApiProperty()
  @IsBoolean()
  maintenanceMode!: boolean;

  @ApiProperty()
  @IsBoolean()
  visibleInApp!: boolean;

  @ApiProperty({
    enum: ['IN_SETUP', 'TRAINING', 'PRODUCTION', 'BLOCKED', 'OFFLINE'],
  })
  @IsIn(['IN_SETUP', 'TRAINING', 'PRODUCTION', 'BLOCKED', 'OFFLINE'])
  status!: 'IN_SETUP' | 'TRAINING' | 'PRODUCTION' | 'BLOCKED' | 'OFFLINE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  trialEndsAt?: string;

  @ApiProperty()
  @IsBoolean()
  sefazHomologacao!: boolean;

  @ApiProperty()
  @IsBoolean()
  contingenciaOffline!: boolean;
}

export class UpdateStoreModuleBodyDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

export class UpdateStoreMemberStatusBodyDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';
}

export class UpsertStoreMemberBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  role!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  generateProvisionalPassword?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sendInviteEmail?: boolean;
}

export class ListStoreAuditLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}

export class CreateStoreMembersBatchItemBodyDto {
  @ApiProperty()
  @IsUUID()
  memberId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  role!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}

export class CreateStoreMembersBatchBodyDto {
  @ApiProperty({ type: [CreateStoreMembersBatchItemBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStoreMembersBatchItemBodyDto)
  members!: CreateStoreMembersBatchItemBodyDto[];
}
