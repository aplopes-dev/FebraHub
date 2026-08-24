import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ALLOWED_THEME_IDS } from '../../../../domain/store-theme-ids';

export class UpdateStoreSettingsHTTPDTO {
  @ApiPropertyOptional({ example: 'Studio Bella' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'purple',
    enum: ALLOWED_THEME_IDS,
  })
  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_THEME_IDS])
  themeId?: string;

  @ApiPropertyOptional({ example: '04.252.011/0001-10' })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string | null;

  @ApiPropertyOptional({ example: 'Studio Bella Comunicações' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  communicationsName?: string | null;

  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsible?: string | null;

  @ApiPropertyOptional({ example: 'contato@studio.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @ApiPropertyOptional({ example: '(73) 3333-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ example: '(73) 99999-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string | null;

  @ApiPropertyOptional({ example: '45660-000' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string | null;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string | null;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string | null;

  @ApiPropertyOptional({ example: 'Sala 2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string | null;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string | null;

  @ApiPropertyOptional({ example: 'Ilhéus' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string | null;
}
