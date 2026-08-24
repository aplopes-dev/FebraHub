import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../application/pagination';

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PERMISSION_IDS = 500;

export class CreatePermissionProfileHttpDto {
  @ApiProperty({ example: 'Supervisor de loja' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @ApiPropertyOptional({ example: 'Acesso operacional sem admin de usuários' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiProperty({ type: [String], example: ['vendas.vendas.view'] })
  @IsArray()
  @ArrayMaxSize(MAX_PERMISSION_IDS)
  @IsString({ each: true })
  permissionIds!: string[];
}

export class UpdatePermissionProfileHttpDto {
  @ApiProperty({ example: 'Supervisor de loja' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @ApiProperty({ example: 'Acesso operacional' })
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(MAX_PERMISSION_IDS)
  @IsString({ each: true })
  permissionIds!: string[];
}

export class ListPermissionProfilesQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  search?: string;

  @ApiPropertyOptional({
    description: 'Quando false, inclui excluídos. Default true.',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
