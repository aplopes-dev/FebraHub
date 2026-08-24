import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MEMBERSHIP_ROLES } from '../../../../../../shared/infra/tenancy/tenant-context';
import { MAX_PER_PAGE } from '../../../../application/pagination';

export class CreateMemberHttpDto {
  @ApiProperty({ example: 'maria@empresa.com.br' })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty({ example: 'Maria' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({
    example: 'Souza',
    description:
      'Sobrenome. Pode ser vazio quando o formulário só tem um nome (evita "Bruno Bruno").',
  })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    description: 'Perfil de acesso da organização (obrigatório)',
    format: 'uuid',
  })
  @IsUUID('4')
  permissionProfileId!: string;

  @ApiPropertyOptional({
    enum: MEMBERSHIP_ROLES,
    default: 'MEMBER',
    description:
      'OWNER e ADMIN operam todas as unidades; MEMBER só as de branchIds. Perfil `administrador` força ADMIN.',
  })
  @IsOptional()
  @IsEnum(MEMBERSHIP_ROLES)
  role?: (typeof MEMBERSHIP_ROLES)[number];

  @ApiPropertyOptional({
    type: [String],
    description:
      'Unidades que o membro pode operar. Ignorado para OWNER/ADMIN.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({
    default: true,
    description:
      'Usuário vendedor — aparece nas listas de vendedor (ERP e PDV)',
  })
  @IsOptional()
  @IsBoolean()
  isSeller?: boolean;
}

export class UpdateMemberHttpDto {
  @ApiPropertyOptional({ enum: MEMBERSHIP_ROLES })
  @IsOptional()
  @IsEnum(MEMBERSHIP_ROLES)
  role?: (typeof MEMBERSHIP_ROLES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Perfil de acesso da organização',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  permissionProfileId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({
    description: 'Código curto de login no PDV (único na organização)',
    example: '01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  pdvCode?: string | null;

  @ApiPropertyOptional({
    description:
      'Usuário vendedor — aparece nas listas de vendedor (ERP e PDV)',
  })
  @IsOptional()
  @IsBoolean()
  isSeller?: boolean;
}

export class ListMembersQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Somente membros ativos' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por flag de usuário vendedor',
  })
  @IsOptional()
  @IsBoolean()
  isSeller?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
