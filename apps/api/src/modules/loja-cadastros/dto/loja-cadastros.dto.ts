import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const texto = () =>
  Transform(({ value }) => {
    const s = typeof value === 'string' ? value.trim() : value;
    return s === '' ? null : s;
  });

export class PaginacaoQuery {
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

  @ApiPropertyOptional({ description: 'YYYY-MM-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-01$/)
  mes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  curso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fonte?: string;
}

export class MetaMesDto {
  @ApiProperty({ example: '2026-08-01' })
  @Matches(/^\d{4}-\d{2}-01$/)
  mes_ref!: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minima?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) basica?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) master?: number | null;
}

export class MetaCursoDto {
  @ApiProperty({ example: '2026-08-01' })
  @Matches(/^\d{4}-\d{2}-01$/)
  mes_ref!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  curso!: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_produtos?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_curso?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_total?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) alunos?: number | null;
}

export class FaturamentoCursoDto {
  @ApiProperty({ example: '2026-08-01' })
  @Matches(/^\d{4}-\d{2}-01$/)
  mes_ref!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @texto()
  curso!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @texto() turma?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @texto() treinador?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) @texto() periodo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) dinheiro?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) debito?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) credito?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) pix?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) total?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) alunos?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) ticket_medio?: number | null;
}

export class ReceitaExtraDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  @texto()
  fonte!: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsISO8601()
  data_venda?: string | null;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-01$/)
  mes_ref?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) @texto() descricao?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) @texto() forma_pagto?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) valor?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) quantidade?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @texto() cliente?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) @texto() documento?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @texto() observacao?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @texto() chave_origem?: string | null;
}

export class FechamentoDto {
  @ApiProperty({ example: '2026-08-01' })
  @Matches(/^\d{4}-\d{2}-01$/)
  mes_ref!: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) faturamento?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_minima?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_basica?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) meta_master?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) @texto() detalhe?: string | null;
}
