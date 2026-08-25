import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SETORES_ORGANOGRAMA } from './organograma.dto';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Nulo explícito continua nulo; string vazia após trim vira undefined. */
const opcionalTexto = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  return value;
};

export class CriarCargoDto {
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsIn(SETORES_ORGANOGRAMA)
  setor!: (typeof SETORES_ORGANOGRAMA)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  nivel?: number;

  @IsOptional()
  @Transform(opcionalTexto)
  @IsString()
  @MaxLength(400)
  descricao?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  cargoPaiId?: string | null;
}

export class AtualizarCargoDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsIn(SETORES_ORGANOGRAMA)
  setor?: (typeof SETORES_ORGANOGRAMA)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  nivel?: number;

  @IsOptional()
  @Transform(opcionalTexto)
  @IsString()
  @MaxLength(400)
  descricao?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  cargoPaiId?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
