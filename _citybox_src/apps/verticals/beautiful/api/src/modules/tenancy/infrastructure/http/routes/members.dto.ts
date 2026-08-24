import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

function toUuidArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parts = Array.isArray(value)
    ? value.flatMap((v) => {
        if (typeof v === 'string' || typeof v === 'number') {
          return String(v).split(',');
        }
        return [];
      })
    : typeof value === 'string' || typeof value === 'number'
      ? String(value).split(',')
      : [];
  const ids = parts.map((p) => p.trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export class CreateMemberBodyDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Telefone / WhatsApp' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  /** profissional | recepcao | gerente — default profissional */
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description:
      'IDs CASL de @citybox/beautiful-permissions. Omitir → defaults do papel',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class ListMembersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'disabled'] })
  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';

  @ApiPropertyOptional({
    description:
      'Quando true, só papéis agendáveis (ignorado se `role` for enviado)',
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  schedulable?: boolean;

  @ApiPropertyOptional({
    description: 'Papel exato na loja: profissional | recepcao | gerente',
    enum: ['profissional', 'recepcao', 'gerente'],
  })
  @IsOptional()
  @IsIn(['profissional', 'recepcao', 'gerente'])
  role?: string;
}

export class WorkIntervalHttpDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime deve estar no formato HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime deve estar no formato HH:mm' })
  endTime!: string;
}

export class WeekScheduleHttpDto {
  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  mon!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  tue!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  wed!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  thu!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  fri!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  sat!: WorkIntervalHttpDto[];

  @ApiProperty({ type: [WorkIntervalHttpDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkIntervalHttpDto)
  sun!: WorkIntervalHttpDto[];
}

export class UpdateMemberBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';

  @ApiPropertyOptional({
    description: 'Papel na loja: profissional | recepcao | gerente',
    enum: ['profissional', 'recepcao', 'gerente'],
  })
  @IsOptional()
  @IsIn(['profissional', 'recepcao', 'gerente'])
  role?: string;

  @ApiPropertyOptional({
    description:
      'IDs CASL de @citybox/beautiful-permissions. Omitir = manter; ao trocar role sem lista = preset do papel',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description:
      'IDs dos serviços (omitir = manter; [] = limpar; lista = substitui)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({
    description: 'Grade semanal (omitir = manter; presente = replace atômico)',
    type: WeekScheduleHttpDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeekScheduleHttpDto)
  week?: WeekScheduleHttpDto;
}

export class ReplaceMemberWorkScheduleBodyDto {
  @ApiProperty({ type: WeekScheduleHttpDto })
  @ValidateNested()
  @Type(() => WeekScheduleHttpDto)
  week!: WeekScheduleHttpDto;
}

export class ListMemberWorkSchedulesQueryDto {
  @ApiPropertyOptional({
    description: 'IDs dos membros (CSV). Ex.: ?memberIds=uuid1,uuid2',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => toUuidArray(value))
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds?: string[];

  @ApiPropertyOptional({
    description: 'Default true — só papéis agendáveis (`profissional`)',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  schedulable?: boolean;
}
