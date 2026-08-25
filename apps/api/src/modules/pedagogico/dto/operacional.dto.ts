import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID,
  Max, MaxLength, Min,
} from 'class-validator';

const trim = () => Transform(({ value }) => {
  const s = typeof value === 'string' ? value.trim() : value;
  return s === '' ? null : s;
});

// ---- CONFIRMAÇÕES ----
export class RegistrarConfirmacaoDto {
  @ApiProperty() @IsUUID() matriculaId!: string;
  @ApiPropertyOptional({ enum: ['whatsapp', 'email', 'ligacao', 'manual'] })
  @IsOptional() @IsIn(['whatsapp', 'email', 'ligacao', 'manual'])
  canal?: string;
  @ApiPropertyOptional({ enum: ['enviado', 'entregue', 'lido', 'respondido', 'confirmado', 'nao_respondeu', 'invalido', 'erro'] })
  @IsOptional() @IsIn(['enviado', 'entregue', 'lido', 'respondido', 'confirmado', 'nao_respondeu', 'invalido', 'erro'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @trim() mensagem?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) @trim() templateTipo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() resposta?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(20) @Type(() => Number) tentativaNum?: number;
}

// ---- CREDENCIAMENTO ----
export class CredenciarAlunoDto {
  @ApiProperty({ description: 'UUID da matrícula ou token QR Code do aluno' })
  @IsString() @MaxLength(200)
  identificador!: string;

  @ApiPropertyOptional({ enum: ['credenciamento', 'recredenciamento'] })
  @IsOptional() @IsIn(['credenciamento', 'recredenciamento'])
  tipo?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() dispositivo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacoes?: string | null;
}

export class BuscarParaCredenciamentoQuery {
  @ApiProperty({ description: 'CPF, nome, UUID da matrícula ou token QR' })
  @IsString() @MaxLength(200)
  q!: string;

  @ApiPropertyOptional({ description: 'UUID da turma para filtrar' })
  @IsOptional() @IsUUID()
  turmaId?: string;
}

// ---- PRESENÇA ----
export class RegistrarPresencaDto {
  @ApiProperty() @IsUUID() matriculaId!: string;
  @ApiProperty() @IsUUID() turmaId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(30) @Type(() => Number) diaNume?: number;
  @ApiPropertyOptional({ enum: ['geral', 'manha', 'tarde', 'noite'] })
  @IsOptional() @IsIn(['geral', 'manha', 'tarde', 'noite'])
  sessao?: string;
  @ApiPropertyOptional({ enum: ['presente', 'ausente', 'justificado', 'atrasado'] })
  @IsOptional() @IsIn(['presente', 'ausente', 'justificado', 'atrasado'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() dispositivo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacoes?: string | null;
}

export class CheckinQrDto {
  @ApiProperty({ description: 'Token QR Code do aluno (não expõe CPF)' })
  @IsString() @MaxLength(500)
  token!: string;

  @ApiProperty() @IsUUID() turmaId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(30) @Type(() => Number) diaNume?: number;
  @ApiPropertyOptional({ enum: ['geral', 'manha', 'tarde', 'noite'] })
  @IsOptional() @IsIn(['geral', 'manha', 'tarde', 'noite'])
  sessao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() dispositivo?: string | null;
}

// ---- TRANSFERÊNCIA ----
export class SolicitarTransferenciaDto {
  @ApiProperty() @IsUUID() matriculaId!: string;
  @ApiProperty() @IsUUID() turmaOrigemId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() turmaDestinoId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() motivo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacoes?: string | null;
}

export class EfetivarTransferenciaDto {
  @ApiProperty() @IsUUID() turmaDestinoId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacoes?: string | null;
}

// ---- MONITORES ----
export class CriarMonitorDto {
  @ApiProperty() @IsString() @MaxLength(200) @trim() pessoaId!: string;
  @ApiProperty() @IsString() @MaxLength(200) @trim() nome!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() usuarioId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() email?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)  @trim() telefone?: string | null;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsString({ each: true }) cursosHabilitados?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @trim() observacoes?: string | null;
}

export class EscalarMonitorDto {
  @ApiProperty() @IsUUID() turmaId!: string;
  @ApiProperty() @IsUUID() monitorId!: string;
  @ApiPropertyOptional({ enum: ['monitor', 'lider', 'apoio', 'coordenador'] })
  @IsOptional() @IsIn(['monitor', 'lider', 'apoio', 'coordenador'])
  funcao?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicio?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) @trim() horario?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacoes?: string | null;
}

// ---- SOLICITAÇÕES ----
export class CriarSolicitacaoDto {
  @ApiProperty({ enum: ['certificado', 'declaracao', 'transferencia', 'cancelamento', 'titularidade', 'suporte'] })
  @IsIn(['certificado', 'declaracao', 'transferencia', 'cancelamento', 'titularidade', 'suporte'])
  tipo!: string;

  @ApiProperty() @IsString() @MaxLength(200) @trim() pessoaId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() matriculaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) @trim() descricao?: string | null;
  @ApiPropertyOptional({ enum: ['baixa', 'normal', 'alta', 'urgente'] })
  @IsOptional() @IsIn(['baixa', 'normal', 'alta', 'urgente'])
  prioridade?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() prazo?: string | null;
}

// ---- DASHBOARD QUERY ----
export class DashboardQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() unidade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cursoId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() turmaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodoInicio?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodoFim?: string;
}
