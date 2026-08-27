import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** Origem de um registro de venda. */
export const ORIGENS = ['FEBRAHUB', 'STONE', 'OMIE'] as const;
export type Origem = (typeof ORIGENS)[number];

/** Status possíveis de conciliação (PRD §19). */
export const STATUS_CONCILIACAO = [
  'CONCILIADA',
  'PARCIALMENTE_CONCILIADA',
  'SOMENTE_STONE',
  'SOMENTE_FEBRAHUB',
  'SOMENTE_OMIE',
  'FEBRAHUB_STONE',
  'FEBRAHUB_OMIE',
  'STONE_OMIE',
  'DIVERGENCIA_VALOR',
  'POSSIVEL_DUPLICIDADE',
  'REQUER_REVISAO',
  'CANCELADA',
  'ESTORNADA',
] as const;

const toNum = ({ value }: { value: unknown }) => {
  if (value === '' || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/** Filtros da listagem consolidada (PRD §4-5). */
export class ListaVendasQuery {
  /** Todas | FEBRAHUB | STONE | OMIE — visão por origem. */
  @IsOptional() @IsIn(['todas', 'FEBRAHUB', 'STONE', 'OMIE']) origem?: string;

  @IsOptional() @IsString() busca?: string;

  @IsOptional() @IsString() dataInicio?: string;
  @IsOptional() @IsString() dataFim?: string;

  @IsOptional() @IsString() unidade?: string;
  @IsOptional() @IsString() evento?: string;
  @IsOptional() @IsString() statusConciliacao?: string;
  @IsOptional() @IsString() formaPagamento?: string;
  @IsOptional() @IsString() terminal?: string;
  @IsOptional() @IsString() operador?: string;

  @IsOptional() @IsString() nsu?: string;
  @IsOptional() @IsString() tid?: string;
  @IsOptional() @IsString() autorizacao?: string;

  @IsOptional() @Transform(toNum) @IsInt() @Min(1) pagina?: number;
  @IsOptional() @Transform(toNum) @IsInt() @Min(1) @Max(200) porPagina?: number;
}

/** Conciliação manual: liga um conjunto de origens numa venda consolidada. */
export class ConciliarDto {
  @IsArray() @IsUUID('all', { each: true }) origemIds!: string[];
  /** Se informado, adiciona à consolidada existente; senão cria uma nova. */
  @IsOptional() @IsUUID() consolidadaId?: string;
}

/** Desvincular uma origem da sua venda consolidada. */
export class DesvincularDto {
  @IsUUID() origemId!: string;
  @IsOptional() @IsString() motivo?: string;
}

/** Sincronização Stone: importa um intervalo (AAAAMMDD) e reconcilia. */
export class SincronizarStoneDto {
  @IsOptional() @IsString() de?: string;
  @IsOptional() @IsString() ate?: string;
  @IsOptional() @IsBoolean() forcar?: boolean;
}

/** Reprocessa a conciliação automática de um intervalo de datas (ISO). */
export class ReconciliarDto {
  @IsOptional() @IsString() dataInicio?: string;
  @IsOptional() @IsString() dataFim?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limiar?: number;
}
