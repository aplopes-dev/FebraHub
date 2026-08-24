import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class ItemSolicitacaoDto {
  @IsOptional() @IsString() produtoId?: string;
  @IsString() @IsNotEmpty() descricao!: string;
  @Type(() => Number) @IsNumber() @Min(0.001) quantidade!: number;
  @IsString() @IsNotEmpty() unidade!: string;
  @IsOptional() @IsString() especificacao?: string;
  @IsOptional() @IsString() finalidade?: string;
  @IsOptional() @IsString() fornecedorSugerido?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valorEstimado?: number;
}
export class CriarSolicitacaoDto {
  @IsString() @IsNotEmpty() titulo!: string;
  @IsIn(['item', 'servico']) tipo!: string;
  @IsString() @IsNotEmpty() justificativa!: string;
  @IsUUID() setorId!: string;
  @IsUUID() unidadeId!: string;
  @IsOptional() @IsString() centroCusto?: string;
  @IsOptional() @IsString() projeto?: string;
  @IsOptional() @IsDateString() dataNecessaria?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsIn(['baixa', 'normal', 'alta', 'urgente']) prioridade?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemSolicitacaoDto) itens!: ItemSolicitacaoDto[];
}
export class AcaoCompraDto {
  @IsString() acao!: string;
  @IsOptional() @IsString() comentario?: string;
}
export class EstoqueItemDto {
  @IsOptional() @Type(() => Number) @IsNumber() produtoId?: number;
  @Type(() => Number) @IsNumber() @Min(0) quantidadeReservada!: number;
}
export class CotacaoDto {
  @IsString() @IsNotEmpty() fornecedor!: string;
  @IsOptional() @IsUUID() fornecedorId?: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() contato?: string;
  @IsOptional() @IsString() documento?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valorUnitario?: number;
  @Type(() => Number) @IsNumber() @Min(0) valorTotal!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) frete?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) desconto?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) prazoDias?: number;
  @IsOptional() @IsString() condicaoPagamento?: string;
  @IsOptional() @IsDateString() validadeProposta?: string;
  @IsOptional() @IsString() garantia?: string;
  @IsOptional() @IsString() observacoes?: string;
}
export class EscolherCotacaoDto {
  @IsString() @IsNotEmpty() criterio!: string;
  @IsOptional() @IsString() justificativa?: string;
}
export class EmitirPedidoDto { @IsOptional() @IsDateString() previsaoEntrega?: string; }
export class ItemRecebimentoDto {
  @IsString() itemId!: string;
  @Type(() => Number) @IsNumber() @Min(0.001) quantidade!: number;
}
export class ReceberDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemRecebimentoDto) itens!: ItemRecebimentoDto[];
  @IsOptional() @IsString() notaFiscal?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsString() divergencia?: string;
}
