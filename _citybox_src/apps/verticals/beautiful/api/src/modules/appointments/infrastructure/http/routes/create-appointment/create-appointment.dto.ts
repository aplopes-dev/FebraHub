import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { APPOINTMENT_STATUSES } from '../../../../domain/appointment.types';

export class CreateAppointmentServiceHTTPDTO {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({ description: 'ID do serviço' })
  @IsUUID()
  serviceId: string;
}

export class CreateAppointmentNewClientHTTPDTO {
  @ApiProperty({ description: 'Nome do cliente novo', example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Telefone / WhatsApp do cliente novo',
    example: '(73) 99876-5432',
  })
  @IsString()
  @MinLength(8)
  phone: string;
}

export class CreateAppointmentHTTPDTO {
  @ApiPropertyOptional({
    description:
      'ID do cliente cadastrado (obrigatório se `newClient` não for enviado)',
  })
  @ValidateIf((o: CreateAppointmentHTTPDTO) => !o.newClient)
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description:
      'Dados para cadastrar o cliente no mesmo request (obrigatório se `clientId` não for enviado)',
    type: CreateAppointmentNewClientHTTPDTO,
  })
  @ValidateIf((o: CreateAppointmentHTTPDTO) => !o.clientId)
  @ValidateNested()
  @Type(() => CreateAppointmentNewClientHTTPDTO)
  newClient?: CreateAppointmentNewClientHTTPDTO;

  @ApiPropertyOptional({ description: 'Observações do atendimento' })
  @IsOptional()
  @IsString()
  clientNotes?: string;

  @ApiPropertyOptional({ description: 'ID da categoria de agendamento' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({
    description: 'Data do agendamento (AAAA-MM-DD)',
    example: '2026-08-10',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato AAAA-MM-DD',
  })
  date: string;

  @ApiProperty({ description: 'Horário de início (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @ApiPropertyOptional({
    description: 'Status inicial',
    enum: APPOINTMENT_STATUSES,
  })
  @IsOptional()
  @IsIn([...APPOINTMENT_STATUSES])
  status?: (typeof APPOINTMENT_STATUSES)[number];

  @ApiProperty({
    description: 'Serviços do agendamento (mín. 1)',
    type: [CreateAppointmentServiceHTTPDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAppointmentServiceHTTPDTO)
  services: CreateAppointmentServiceHTTPDTO[];
}
