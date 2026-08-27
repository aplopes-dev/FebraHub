import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID,
  Max, MaxLength, Min,
} from 'class-validator';
import { PaginacaoDto } from '../../../common/dto/paginacao.dto';

const STATUS_TURMA = [
  'Planejada', 'Aguardando Validação', 'Confirmada',
  'Em Preparação', 'Em Andamento', 'Finalizada', 'Cancelada',
] as const;

const trim = () => Transform(({ value }) => {
  const s = typeof value === 'string' ? value.trim() : value;
  return s === '' ? null : s;
});

export class CriarTurmaDto {
  @ApiProperty() @IsString() @MaxLength(200) @trim() nome!: string;
  @ApiProperty() @IsString() @MaxLength(200) @trim() cursoNome!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() turmaIdSf?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() dimTurmaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() cursoId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() unidade?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) @trim() local?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) @trim() endereco?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicio?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)  @trim() horarioInicio?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)  @trim() horarioFim?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)  @trim() horarioCredenciamento?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() treinador?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsUUID() responsavelId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(10_000) @Type(() => Number) capacidade?: number | null;
  @ApiPropertyOptional({ enum: STATUS_TURMA }) @IsOptional() @IsIn(STATUS_TURMA) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) @trim() linkGrupo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) @trim() linkExterno?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)  @trim() sigla?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2020) @Max(2100) @Type(() => Number) anoFiscal?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @trim() observacoes?: string | null;
}

export class AtualizarTurmaDto extends CriarTurmaDto {}

export class FiltrosTurmaQuery extends PaginacaoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) unidade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) cursoId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicioDe?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicioAte?: string;
  // pagina, porPagina e busca vêm de PaginacaoDto.
}
