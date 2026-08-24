import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentGenerateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  templateId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ enum: ['contract', 'other'] })
  @IsOptional()
  @IsIn(['contract', 'other'])
  kind?: 'contract' | 'other';
}
