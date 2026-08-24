import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PERMISSION_KEYS,
  TEAM_MEMBER_ROLES,
} from '../../../../domain/entities/team-member.entity';

export class UpdateTeamMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ enum: TEAM_MEMBER_ROLES })
  @IsOptional()
  @IsIn(TEAM_MEMBER_ROLES)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: `Chaves suportadas: ${PERMISSION_KEYS.join(', ')}`,
    type: 'object',
    additionalProperties: { type: 'boolean' },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}
