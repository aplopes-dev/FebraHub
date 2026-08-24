import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * O anexo chega no campo multipart `file` e é lido por `@UploadedFile()`.
 * Declará-lo aqui faria o `ValidationPipe` (whitelist + forbidNonWhitelisted)
 * rejeitar o corpo inteiro, porque a propriedade existe na instância sem validador.
 */
export class SavePatientNutritionNoteBodyDto {
  @ApiProperty({ description: 'HTML do editor de texto da nota' })
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;
}
