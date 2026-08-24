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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PERMISSION_KEYS,
  TEAM_MEMBER_ROLES,
} from '../../../../domain/entities/team-member.entity';

export class CreateTeamMemberDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ enum: TEAM_MEMBER_ROLES })
  @IsIn(TEAM_MEMBER_ROLES)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Chaves desconhecidas são descartadas pelo use case. */
  @ApiPropertyOptional({
    description: `Chaves suportadas: ${PERMISSION_KEYS.join(', ')}`,
    type: 'object',
    additionalProperties: { type: 'boolean' },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}
