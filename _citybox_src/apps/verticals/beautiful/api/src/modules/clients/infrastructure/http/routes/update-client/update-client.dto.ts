import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateClientHTTPDTO {
  @ApiPropertyOptional({
    description: 'Nome do cliente',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone / WhatsApp do cliente',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria (null remove o vínculo)',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUUID()
  categoryId?: string | null;
}
