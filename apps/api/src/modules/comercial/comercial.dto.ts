/**
 * DTOs do módulo Comercial/CRM de vendas.
 *
 * Regras obrigatórias (PRD):
 *  - Dinheiro em centavos (BigInt/inteiro) — nunca Decimal no transport.
 *  - Status comercial ≠ status financeiro — NUNCA misturar.
 *  - Deduplicação: CPF > telefone > email antes de criar pessoa nova.
 */
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/* ─────────────────────── Oportunidade ─────────────────────── */

export class CriarOportunidadeDto {
  @IsUUID() pessoaId!: string;

  @IsOptional() @IsUUID() produtoId?: string;

  @IsUUID() funilId!: string;

  @IsUUID() etapaId!: string;

  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  /** Valor estimado em centavos inteiros. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) valorEstimadoCentavos?: number;

  @IsOptional() @IsString() @MaxLength(80) origem?: string;

  @IsOptional() @IsString() @MaxLength(80) canal?: string;

  @IsOptional() @IsString() @MaxLength(120) campanha?: string;

  @IsOptional() @IsString() @MaxLength(120) eventoRef?: string;

  @IsOptional() @IsString() @MaxLength(120) utmSource?: string;

  @IsOptional() @IsString() @MaxLength(120) utmMedium?: string;

  @IsOptional() @IsString() @MaxLength(120) utmCampaign?: string;

  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
}

export class AtualizarOportunidadeDto {
  @IsOptional() @IsUUID() pessoaId?: string;

  @IsOptional() @IsUUID() produtoId?: string;

  @IsOptional() @IsUUID() funilId?: string;

  @IsOptional() @IsUUID() etapaId?: string;

  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) valorEstimadoCentavos?: number;

  @IsOptional() @IsString() @MaxLength(80) origem?: string;

  @IsOptional() @IsString() @MaxLength(80) canal?: string;

  @IsOptional() @IsString() @MaxLength(120) campanha?: string;

  @IsOptional() @IsString() @MaxLength(120) eventoRef?: string;

  @IsOptional() @IsString() @MaxLength(120) utmSource?: string;

  @IsOptional() @IsString() @MaxLength(120) utmMedium?: string;

  @IsOptional() @IsString() @MaxLength(120) utmCampaign?: string;

  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;

  @IsOptional()
  @IsIn(['aberta', 'ganha', 'perdida', 'arquivada'])
  status?: string;

  @IsOptional() @IsUUID() motivoPerdaId?: string;

  @IsOptional() @IsString() @MaxLength(500) motivoPerdaTexto?: string;

  @IsOptional() @IsISO8601() proximaAcaoEm?: string;

  @IsOptional() @IsString() @MaxLength(300) proximaAcaoDescricao?: string;

  @IsOptional() @IsUUID() turmaId?: string;

  @IsOptional() @IsBoolean() turmaADefinir?: boolean;
}

export class MoverEtapaDto {
  @IsUUID() etapaId!: string;

  @IsOptional() @IsUUID() motivoPerdaId?: string;

  @IsOptional() @IsString() @MaxLength(500) motivoPerdaTexto?: string;
}

/* ─────────────────────── Interação ─────────────────────── */

export class RegistrarInteracaoDto {
  @IsString() @IsNotEmpty() @MaxLength(80) tipo!: string;

  @IsString() @IsNotEmpty() @MaxLength(3000) descricao!: string;

  @IsOptional() @IsString() @MaxLength(80) canal?: string;
}

/* ─────────────────────── Próxima Ação ─────────────────────── */

export class CriarProximaAcaoDto {
  @IsIn(['ligar', 'whatsapp', 'email', 'reuniao', 'proposta', 'follow_up', 'outro'])
  tipo!: string;

  @IsString() @IsNotEmpty() @MaxLength(200) titulo!: string;

  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;

  @IsISO8601() venceEm!: string;

  @IsOptional()
  @IsIn(['alta', 'media', 'baixa'])
  prioridade?: string;
}

/* ─────────────────────── Negociação ─────────────────────── */

export class CriarNegociacaoDto {
  @IsOptional() @IsUUID() produtoId?: string;

  @IsOptional() @IsString() @MaxLength(200) produtoNome?: string;

  @Type(() => Number) @IsInt() @Min(1) quantidade!: number;

  /** Preço de tabela em centavos. */
  @Type(() => Number) @IsInt() @Min(0) precoTabelaCentavos!: number;

  /** Desconto em centavos. */
  @Type(() => Number) @IsInt() @Min(0) descontoCentavos!: number;

  /** Valor final negociado em centavos. */
  @Type(() => Number) @IsInt() @Min(0) valorNegociadoCentavos!: number;

  /** Valor de entrada em centavos. */
  @Type(() => Number) @IsInt() @Min(0) entradaCentavos!: number;

  @Type(() => Number) @IsInt() @Min(1) numParcelas!: number;

  /** Valor de cada parcela em centavos. */
  @Type(() => Number) @IsInt() @Min(0) valorParcelaCentavos!: number;

  @IsIn(['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'cortesia', 'outro'])
  formaPagamento!: string;

  @IsOptional() @IsArray() vencimentos?: string[];

  @IsOptional() @IsString() @MaxLength(300) condicaoEspecial?: string;

  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;

  @IsOptional() @IsUUID() turmaId?: string;

  @IsOptional() @IsBoolean() turmaADefinir?: boolean;
}

/* ─────────────────────── Venda ─────────────────────── */

export class CriarVendaDto {
  /** Beneficiário pode ser diferente do comprador (PRD §31). */
  @IsOptional() @IsUUID() beneficiarioId?: string;

  @IsOptional() @IsString() @MaxLength(200) beneficiarioNome?: string;

  @IsOptional() @IsUUID() vendedorId?: string;

  @IsOptional() @IsUUID() relacionadoraId?: string;

  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
}

export class AprovarVendaDto {
  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
}

export class CancelarVendaDto {
  @IsString() @IsNotEmpty() @MaxLength(500) motivo!: string;
}

/* ─────────────────────── Transferência ─────────────────────── */

export class TransferirResponsavelDto {
  @IsUUID() responsavelNovoId!: string;

  @IsOptional() @IsString() @MaxLength(500) motivo?: string;
}

/* ─────────────────────── Filtros ─────────────────────── */

export class FiltroOportunidadesDto {
  @IsOptional()
  @IsIn(['aberta', 'ganha', 'perdida', 'arquivada'])
  status?: string;

  @IsOptional() @IsUUID() etapaId?: string;

  @IsOptional() @IsUUID() funilId?: string;

  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsUUID() pessoaId?: string;

  @IsOptional() @IsString() @MaxLength(80) origem?: string;

  @IsOptional() @IsString() @MaxLength(120) campanha?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  /** ISO 8601 date string — início do período. */
  @IsOptional() @IsISO8601() periodoInicio?: string;

  /** ISO 8601 date string — fim do período. */
  @IsOptional() @IsISO8601() periodoFim?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limite?: number;
}

export class FiltroVendasDto {
  @IsOptional()
  @IsIn(['rascunho', 'aguardando_aprovacao', 'aprovada', 'cancelada'])
  statusComercial?: string;

  @IsOptional()
  @IsIn(['pendente', 'parcial', 'quitado', 'inadimplente', 'estornado'])
  statusFinanceiro?: string;

  @IsOptional() @IsUUID() vendedorId?: string;

  @IsOptional() @IsUUID() compradorId?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  @IsOptional() @IsISO8601() periodoInicio?: string;

  @IsOptional() @IsISO8601() periodoFim?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limite?: number;
}

/* ─────────────────────── Lead / Pessoa ─────────────────────── */

export class CriarLeadDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(160) nome!: string;

  @IsString() @IsNotEmpty() @MaxLength(30) whatsapp!: string;

  @IsOptional() @IsString() @MaxLength(160) email?: string;

  @IsString() @IsNotEmpty() @MaxLength(80) origem!: string;

  @IsOptional() @IsString() @MaxLength(80) canal?: string;

  @IsOptional() @IsString() @MaxLength(120) campanha?: string;

  @IsOptional() @IsString() @MaxLength(120) eventoRef?: string;

  @IsOptional() @IsString() @MaxLength(120) utmSource?: string;

  @IsOptional() @IsString() @MaxLength(120) utmMedium?: string;

  @IsOptional() @IsString() @MaxLength(120) utmCampaign?: string;

  @IsOptional() @IsString() @MaxLength(120) utmContent?: string;

  @IsOptional() @IsString() @MaxLength(120) utmTerm?: string;

  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsString() @MaxLength(200) produtoInteresse?: string;
}

export class BuscarPessoaDto {
  @IsOptional() @IsString() @MaxLength(30) cpf?: string;

  @IsOptional() @IsString() @MaxLength(160) email?: string;

  @IsOptional() @IsString() @MaxLength(30) telefone?: string;

  @IsOptional() @IsString() @MaxLength(160) nome?: string;
}

/* ─────────────────────── Concluir Ação ─────────────────────── */

export class ConcluirAcaoDto {
  @IsOptional() @IsString() @MaxLength(1000) resultado?: string;
}

/* ─────────────────────── Definir Turma ─────────────────────── */

export class DefinirTurmaDto {
  @IsUUID() turmaId!: string;
}

/* ─────────────────────── Dashboard ─────────────────────── */

export class FiltroDashboardDto {
  @IsOptional() @IsUUID() funilId?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsISO8601() periodoInicio?: string;

  @IsOptional() @IsISO8601() periodoFim?: string;
}

/* ─────────────────────── Kanban ─────────────────────── */

export class FiltroKanbanDto {
  @IsOptional() @IsUUID() responsavelId?: string;

  @IsOptional() @IsString() @MaxLength(80) unidade?: string;

  @IsOptional() @IsString() @MaxLength(120) campanha?: string;
}

/* ─────────────────────── Negociação (Atualizar) ─────────────────────── */

export class AtualizarNegociacaoDto {
  @IsOptional() @IsUUID() produtoId?: string;

  @IsOptional() @IsString() @MaxLength(200) produtoNome?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantidade?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) precoTabelaCentavos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) descontoCentavos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) valorNegociadoCentavos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) entradaCentavos?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) numParcelas?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) valorParcelaCentavos?: number;

  @IsOptional()
  @IsIn(['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'cortesia', 'outro'])
  formaPagamento?: string;

  @IsOptional() @IsArray() vencimentos?: string[];

  @IsOptional() @IsString() @MaxLength(300) condicaoEspecial?: string;

  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;

  @IsOptional() @IsUUID() turmaId?: string;

  @IsOptional() @IsBoolean() turmaADefinir?: boolean;
}

/* ─────────────────────── Sincronização Salesforce ─────────────────────── */

export class SyncSalesforceDto {
  @IsString() @IsNotEmpty() entidade!: string;

  @IsOptional() dados?: Record<string, unknown>;
}

/* ─────────────────────── Número da Venda ─────────────────────── */

export class NumeroVendaDto {
  @IsNumber() @IsInt() @Min(1) numero!: number;
}
