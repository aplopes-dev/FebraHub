import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PlatformRole } from '../../../../domain/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@citybox.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({
    enum: ['platform_admin', 'platform_operator'],
    default: 'platform_operator',
  })
  @IsOptional()
  @IsString()
  @IsIn(['platform_admin', 'platform_operator'])
  role?: PlatformRole;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}
