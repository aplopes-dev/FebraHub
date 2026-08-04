import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PERMISSOES } from './catalogo';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Setores válidos no cadastro: os hubs + 'geral' (a diretoria histórica). */
export const SETORES_CADASTRO = [
  'geral',
  'comercial',
  'financeiro',
  'marketing',
  'pedagogico',
  'eventos',
  'loja',
  'estoque',
  'crm',
] as const;

export const PAPEIS = ['admin', 'gestor', 'membro'] as const;

/* ---------------------------------- perfis --------------------------------- */

export class CriarPerfilDto {
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  nome!: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(240)
  descricao?: string;

  /** Teto pelo tamanho do catálogo: lista maior que ele só pode ser repetição
   *  ou lixo, e o service ainda recusa id desconhecido. */
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(PERMISSOES.length)
  permissoes!: string[];
}

export class AtualizarPerfilDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  nome?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(240)
  descricao?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(PERMISSOES.length)
  permissoes?: string[];
}

/* --------------------------------- usuários -------------------------------- */

export class CriarUsuarioDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome!: string;

  @IsIn(PAPEIS)
  papel!: (typeof PAPEIS)[number];

  @IsIn(SETORES_CADASTRO)
  setor!: (typeof SETORES_CADASTRO)[number];

  @IsOptional()
  @IsArray()
  @IsIn(SETORES_CADASTRO, { each: true })
  setoresExtras?: string[];

  @IsOptional()
  @IsUUID()
  perfilAcessoId?: string;
}

export class AtualizarUsuarioDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsIn(PAPEIS)
  papel?: (typeof PAPEIS)[number];

  @IsOptional()
  @IsIn(SETORES_CADASTRO)
  setor?: (typeof SETORES_CADASTRO)[number];

  @IsOptional()
  @IsArray()
  @IsIn(SETORES_CADASTRO, { each: true })
  setoresExtras?: string[];

  /** null desvincula o perfil (a pessoa cai no fallback por setor). */
  @IsOptional()
  @IsUUID()
  perfilAcessoId?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
