import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const texto = () => Transform(({ value }) => {
  const s = typeof value === 'string' ? value.trim() : value;
  return s === '' ? null : s;
});

export class AvaliacaoListaQuery {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  por_pagina?: number = 50;

  @ApiPropertyOptional({ enum: ['ggb', 'evento'] })
  @IsOptional()
  @IsIn(['ggb', 'evento'])
  fonte?: 'ggb' | 'evento';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  curso?: string;
}

export class AvaliacaoDto {
  @ApiProperty({ enum: ['ggb', 'evento'] })
  @IsIn(['ggb', 'evento'])
  fonte!: 'ggb' | 'evento';

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  curso!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  treinador!: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsISO8601()
  data_curso!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @texto()
  turma?: string | null;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(10_000)
  respondentes!: number;

  // As médias vêm calculadas do front (ele já faz o parse do TSV/CSV colado).
  // A escala é 0-10 no GGB e 1-5 no evento; o teto de 10 cobre as duas.
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_conteudo?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_clareza?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_material?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_aplicacao?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_dominio?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_pontualidade?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) q_duvidas?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) nps?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) nota_treinador?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  @texto()
  comentario?: string | null;
}

export class AvaliacaoEventoDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  evento!: string;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsISO8601()
  data_evento?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  nota_indicacao?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  @texto()
  comentario?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  @texto()
  respostas?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @texto()
  resposta_id?: string | null;
}

export class MaestroAnotacaoDto {
  @ApiProperty({ description: 'CPF do maestro — é a chave em maestro_anotacao' })
  @IsString()
  @MaxLength(40)
  aluno_id!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @texto()
  como_gosta_ser_chamado?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) @texto()
  cargo?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @texto()
  empresa?: string | null;

  // Texto, não número: o campo é preenchido à mão e chega como "R$ 5.000.000,50".
  // Converter aqui perderia o que a pessoa escreveu; o front normaliza para exibir.
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) @texto()
  faturamento?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @texto()
  observacoes?: string | null;
}

export class RetencaoDto {
  @ApiPropertyOptional({ description: 'Ausente cria; presente atualiza' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  nome_cliente!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  curso!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) @texto()
  motivo_cancelamento?: string | null;

  @ApiPropertyOptional({ example: '2026-07-20' })
  @IsOptional()
  @IsISO8601()
  data_ligacao?: string | null;

  @ApiPropertyOptional({ enum: ['pendente', 'retido', 'cancelado'] })
  @IsOptional()
  @IsIn(['pendente', 'retido', 'cancelado'])
  desfecho?: 'pendente' | 'retido' | 'cancelado';

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @texto()
  observacoes?: string | null;
}
