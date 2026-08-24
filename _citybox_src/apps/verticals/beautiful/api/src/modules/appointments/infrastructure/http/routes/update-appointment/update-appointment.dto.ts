import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

export class UpdateAppointmentServiceHTTPDTO {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({ description: 'ID do serviço' })
  @IsUUID()
  serviceId: string;
}

export class UpdateAppointmentHTTPDTO {
  @ApiPropertyOptional({ description: 'Observações do atendimento' })
  @IsOptional()
  @IsString()
  clientNotes?: string | null;

  @ApiPropertyOptional({ description: 'ID da categoria de agendamento' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({
    description: 'Data do agendamento (AAAA-MM-DD)',
    example: '2026-08-11',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato AAAA-MM-DD',
  })
  date: string;

  @ApiProperty({ description: 'Horário de início (HH:mm)', example: '14:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Serviços do agendamento (mín. 1) — substitui a lista atual',
    type: [UpdateAppointmentServiceHTTPDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAppointmentServiceHTTPDTO)
  services: UpdateAppointmentServiceHTTPDTO[];
}
