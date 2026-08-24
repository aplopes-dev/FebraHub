import { IsArray, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export const SITUACOES = ['levantamento_iniciado', 'rascunho', 'aguardando_informacoes', 'aguardando_validacao', 'ajustes_solicitados', 'aprovado', 'em_desenvolvimento', 'em_homologacao', 'implantado', 'suspenso', 'substituido', 'arquivado'] as const;

export class CriarProcessoDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsString() @IsNotEmpty() codigo!: string;
  @IsString() @IsNotEmpty() objetivo!: string;
  @IsString() @IsNotEmpty() setorPrincipal!: string;
  @IsArray() @IsString({ each: true }) setoresParticipantes: string[] = [];
  @IsOptional() @IsUUID() responsavelProcessoId?: string;
  @IsOptional() @IsUUID() responsavelLevantamentoId?: string;
  @IsOptional() @IsUUID() validadorId?: string;
  @IsString() @IsNotEmpty() eventoInicial!: string;
  @IsString() @IsNotEmpty() resultadoEsperado!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsIn(SITUACOES) situacao?: string;
  @IsOptional() @IsIn(['baixa', 'media', 'alta', 'critica']) criticidade?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class AtualizarProcessoDto {
  @IsInt() @Min(1) revisao!: number;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() objetivo?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() eventoInicial?: string;
  @IsOptional() @IsString() resultadoEsperado?: string;
  @IsOptional() @IsIn(['baixa', 'media', 'alta', 'critica']) criticidade?: string;
  @IsOptional() @IsObject() entrevista?: Record<string, unknown>;
  @IsOptional() @IsString() bpmnXml?: string;
  @IsOptional() @IsObject() manual?: Record<string, unknown>;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() motivo?: string;
}

export class TransicaoDto {
  @IsIn(['enviar_validacao', 'solicitar_ajustes', 'rejeitar', 'aprovar', 'publicar']) acao!: string;
  @IsOptional() @IsString() motivo?: string;
}

export class EntregaDto {
  @IsString() titulo!: string;
  @IsIn(['sistema', 'automacao', 'agentes_ia']) pilar!: string;
  @IsString() setor!: string;
  @IsString() fase!: string;
  @Min(0) peso!: number;
  @IsOptional() @IsIn(['nao_iniciado', 'em_andamento', 'aguardando_validacao', 'concluido', 'cancelado']) situacao?: string;
  @IsOptional() @Min(0) @Max(100) percentualAceito?: number;
  @IsOptional() @IsString() evidencia?: string;
}
