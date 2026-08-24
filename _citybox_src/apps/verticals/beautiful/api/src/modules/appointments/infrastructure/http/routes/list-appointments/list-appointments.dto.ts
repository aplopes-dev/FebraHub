import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { APPOINTMENT_STATUSES } from '../../../../domain/appointment.types';

export class ListAppointmentsQueryDTO {
  @ApiProperty({
    description: 'Início do período (AAAA-MM-DD, inclusive)',
    example: '2026-08-01',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from: string;

  @ApiProperty({
    description: 'Fim do período (AAAA-MM-DD, inclusive)',
    example: '2026-08-31',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to: string;

  @ApiPropertyOptional({ description: 'Filtrar por profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: APPOINTMENT_STATUSES,
  })
  @IsOptional()
  @IsIn([...APPOINTMENT_STATUSES])
  status?: (typeof APPOINTMENT_STATUSES)[number];
}
