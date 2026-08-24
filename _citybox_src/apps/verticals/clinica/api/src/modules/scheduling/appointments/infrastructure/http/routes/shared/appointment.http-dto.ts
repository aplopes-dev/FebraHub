import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { APPOINTMENT_STATUSES } from '../../../../../shared/domain/appointment-types';
import type { AppointmentStatus } from '../../../../../shared/domain/appointment-types';
import type {
  AppointmentChannel,
  InsuranceType,
  ReturnOption,
} from '../../../../../shared/domain/scheduling-enums';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  professionalIds?: string;

  @IsOptional()
  @IsEnum(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsEnum(['startAt', 'status', 'patientName'])
  sortBy?: 'startAt' | 'status' | 'patientName';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class CalendarQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  professionalIds?: string;
}

export class CreateAppointmentBodyDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  professionalId!: string;

  @IsOptional()
  @IsString()
  professionalName?: string;

  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  channel?: AppointmentChannel;

  @IsOptional()
  @IsString()
  insuranceType?: InsuranceType;

  @IsDateString()
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMin!: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  returnOption?: ReturnOption;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  returnReason?: string;

  @IsOptional()
  @IsUUID()
  fitInId?: string;

  @IsOptional()
  @IsUUID()
  returnAlertId?: string;

  @IsOptional()
  @IsBoolean()
  sendWhatsAppConfirmation?: boolean;
}

export class UpdateAppointmentBodyDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  professionalName?: string;

  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  channel?: AppointmentChannel;

  @IsOptional()
  @IsString()
  insuranceType?: InsuranceType;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  returnOption?: ReturnOption;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  returnReason?: string;

  @IsOptional()
  @IsBoolean()
  sendWhatsAppConfirmation?: boolean;
}

export class UpdateAppointmentStatusBodyDto {
  @IsEnum(APPOINTMENT_STATUSES)
  status!: AppointmentStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(['manual', 'whatsapp'])
  confirmationSource?: 'manual' | 'whatsapp' | null;
}

export function parseProfessionalIds(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}
