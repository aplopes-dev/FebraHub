import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientCertificateBodyDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiProperty()
  @IsString()
  professionalName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiProperty({ enum: ['days', 'attendance'] })
  @IsEnum(['days', 'attendance'] as const)
  type!: 'days' | 'attendance';

  @ApiProperty({ description: 'Data do atestado (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  issuedDate!: string;

  @ApiPropertyOptional({ description: 'Obrigatório quando type=days' })
  @IsOptional()
  @IsString()
  daysCount?: string;

  @ApiPropertyOptional({
    description: 'Obrigatório quando type=attendance (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Obrigatório quando type=attendance (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cid?: string;

  @ApiPropertyOptional({ enum: ['CRM', 'CRO', 'CREFITO'] })
  @IsOptional()
  @IsEnum(['CRM', 'CRO', 'CREFITO'] as const)
  councilType?: 'CRM' | 'CRO' | 'CREFITO';

  @ApiPropertyOptional({ description: 'Somente dígitos' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  councilNumber?: string;

  @ApiPropertyOptional({ description: 'UF (CRM/CRO) ou regional CREFITO 01–20' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{2}$/)
  councilUf?: string;
}
