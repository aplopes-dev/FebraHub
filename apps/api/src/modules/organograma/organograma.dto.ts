import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

/**
 * Setores válidos do organograma = hubs do menu MENOS o CRM (decisão do
 * Rafael, 03/08: o organograma mostra a operação; o CRM é ferramenta).
 * A lista vive aqui (e espelhada no front) porque o backend é quem manda:
 * um setor fora dela nunca entra no banco, venha a UI que vier.
 */
export const SETORES_ORGANOGRAMA = [
  'comercial',
  'financeiro',
  'marketing',
  'pedagogico',
  'eventos',
  'loja',
  'estoque',
] as const;

export const TIPOS_MEMBRO = ['funcionario', 'agente'] as const;

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CriarMembroDto {
  @IsIn(TIPOS_MEMBRO)
  tipo!: (typeof TIPOS_MEMBRO)[number];

  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  funcao!: string;

  @IsIn(SETORES_ORGANOGRAMA)
  setor!: (typeof SETORES_ORGANOGRAMA)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}

export class AtualizarMembroDto {
  @IsOptional()
  @IsIn(TIPOS_MEMBRO)
  tipo?: (typeof TIPOS_MEMBRO)[number];

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  funcao?: string;

  @IsOptional()
  @IsIn(SETORES_ORGANOGRAMA)
  setor?: (typeof SETORES_ORGANOGRAMA)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
