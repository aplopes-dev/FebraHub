import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MAX_APPOINTMENT_DESCRIPTION,
  MAX_APPOINTMENT_TITLE,
} from '../../../../application/use-cases/shared/normalize-appointment-write';

const APPOINTMENT_KINDS = ['visit', 'follow-up', 'signing', 'other'] as const;

/** Payload HTTP de create/update de compromisso. */
export class AppointmentWriteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_APPOINTMENT_TITLE)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_APPOINTMENT_DESCRIPTION)
  description?: string;

  @ApiProperty({ description: 'ISO-8601 datetime' })
  @IsString()
  startsAt!: string;

  @ApiProperty({ description: 'ISO-8601 datetime' })
  @IsString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ enum: APPOINTMENT_KINDS })
  @IsIn(APPOINTMENT_KINDS)
  kind!: (typeof APPOINTMENT_KINDS)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  agentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  leadId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  leadName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  leadEmail?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  leadPhone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  leadPhotoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  propertyId?: string | null;
}
