import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  IsIn,
  Matches,
  ValidateNested,
} from 'class-validator';

export class MemberClinicAssignmentDto {
  @ApiProperty() @IsString() clinicId!: string;
  @ApiProperty({ example: 'dentista' }) @IsString() role!: string;

  /**
   * IDs CASL de `@citybox/clinica-permissions`. Omitir → defaults do cargo.
   * Array vazio = sem permissões de loja (além do acesso vertical Keycloak).
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class CreateMemberBodyDto {
  @ApiProperty() @IsString() @Length(1, 80) firstName!: string;
  @ApiProperty() @IsString() @Length(1, 80) lastName!: string;

  @ApiProperty({ example: 'maria.silva' })
  @IsString()
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'username aceita minúsculas, números, ponto, hífen e underscore',
  })
  @Length(3, 60)
  username!: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;

  @ApiProperty({ type: [MemberClinicAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MemberClinicAssignmentDto)
  clinics!: MemberClinicAssignmentDto[];
}

export class UpdateMemberBodyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;

  /** Conjunto FINAL de clínicas/papéis — a rota reescreve o escopo, não aplica delta. */
  @ApiPropertyOptional({ type: [MemberClinicAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberClinicAssignmentDto)
  clinics?: MemberClinicAssignmentDto[];
}

export class SetMemberStatusBodyDto {
  @ApiProperty({ enum: ['active', 'disabled'] })
  @IsIn(['active', 'disabled'])
  status!: 'active' | 'disabled';
}
