import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateClientHTTPDTO {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Maria Souza',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Telefone / WhatsApp do cliente',
    example: '(73) 99876-5432',
  })
  @IsString()
  @MinLength(8)
  phone: string;

  @ApiPropertyOptional({ description: 'ID da categoria (opcional)' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUUID()
  categoryId?: string | null;
}
