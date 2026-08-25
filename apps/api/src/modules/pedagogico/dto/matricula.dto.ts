import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString, IsIn, IsOptional, IsString, IsUUID,
  MaxLength,
} from 'class-validator';

export const STATUS_MATRICULA = [
  'Matriculado', 'Aguardando Contato', 'Aguardando Resposta', 'Confirmado',
  'Não Respondeu', 'Próxima Turma', 'Transferência Solicitada',
  'Transferência Pendente', 'Transferido', 'Cancelamento Solicitado',
  'Cancelado', 'Credenciado', 'Em Curso', 'Concluído', 'Faltou', 'Represado',
] as const;

const trim = () => Transform(({ value }) => {
  const s = typeof value === 'string' ? value.trim() : value;
  return s === '' ? null : s;
});

export class CriarMatriculaDto {
  @ApiProperty({ description: 'ID da pessoa (crm_clientes.id ou dim_alunos.aluno_id)' })
  @IsString() @MaxLength(200) @trim()
  pessoaId!: string;

  @ApiProperty({ description: 'UUID da turma (pedagogico_turmas.id)' })
  @IsUUID()
  turmaId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() pessoaNome?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)  @trim() pessoaCpf?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() pessoaEmail?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)  @trim() pessoaTelefone?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() matriculaSfId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() vendaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) @trim() cursoId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() cursoNome?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataCompra?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataMatricula?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validadeInicio?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validadeFim?: string | null;
  @ApiPropertyOptional({ enum: STATUS_MATRICULA }) @IsOptional() @IsIn(STATUS_MATRICULA) status?: string;
  @ApiPropertyOptional({ enum: ['salesforce', 'manual', 'portal', 'importacao'] })
  @IsOptional() @IsIn(['salesforce', 'manual', 'portal', 'importacao'])
  origem?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() unidade?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @trim() vendedor?: string | null;
}

export class AtualizarStatusMatriculaDto {
  @ApiProperty({ enum: STATUS_MATRICULA })
  @IsIn(STATUS_MATRICULA)
  status!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @trim() observacao?: string | null;
}

export class FiltrosMatriculaQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() busca?: string;      // nome, CPF, email, telefone
  @ApiPropertyOptional() @IsOptional() @IsString() turmaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cursoId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidade?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validadeAte?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) pagina?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) porPagina?: number = 50;
}

export class IntegrarVendaDto {
  @ApiProperty({ description: 'ID da venda no Salesforce' })
  @IsString() @MaxLength(120)
  vendaId!: string;

  @ApiProperty({ description: 'ID do aluno no Salesforce' })
  @IsString() @MaxLength(120)
  alunoId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) turmaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) cursoId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) alunoNome?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)  alunoCpf?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) alunoEmail?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)  alunoTelefone?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) cursoNome?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataCompra?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) unidade?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) vendedor?: string | null;
}
