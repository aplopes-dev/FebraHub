import { Type } from 'class-transformer';
import {
  ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsUUID, Min, ValidateNested,
} from 'class-validator';

// -------------------- OPERAÇÕES --------------------

export class SalvarOperacaoDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsIn(['RETIRADA_BALCAO', 'SERVICO_MESA']) modo?: string;
  @IsOptional() @IsIn(['ativa', 'encerrada', 'suspensa']) status?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() inicio?: string;
  @IsOptional() @IsString() fim?: string;
}

// -------------------- CHECKOUT --------------------

export class ItemPedidoDto {
  @IsUUID() produtoId!: string;
  @Type(() => Number) @IsNumber() @Min(0.001) quantidade!: number;
  @IsOptional() @IsString() observacao?: string;
}

/** Checkout público (cardápio) ou interno (PDV). O cliente manda só
 *  produto+quantidade; o backend determina preço, estoque e total. */
export class CheckoutDto {
  @IsOptional() @IsUUID() operacaoId?: string;
  @IsOptional() @IsIn(['CARDAPIO_DIGITAL', 'PDV']) canal?: string;
  @IsOptional() @IsString() clienteNome?: string;
  @IsOptional() @IsString() clienteTel?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto)
  itens!: ItemPedidoDto[];
}

// -------------------- PAGAMENTO --------------------

export const FORMAS_PAGAMENTO = ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO'] as const;

/** Dados do cartão no checkout público. NÃO são persistidos: o backend repassa
 *  ao gateway (ASAAS) e descarta — PRD §18 (nunca guardar CVV/número). */
export class CartaoDto {
  @IsString() @IsNotEmpty() numero!: string;
  @IsString() @IsNotEmpty() titular!: string;
  @IsString() @IsNotEmpty() validadeMes!: string;
  @IsString() @IsNotEmpty() validadeAno!: string;
  @IsString() @IsNotEmpty() cvv!: string;
  @IsOptional() @IsString() cpfCnpj?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() numeroEndereco?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() email?: string;
}

export class IniciarPagamentoDto {
  @IsIn(FORMAS_PAGAMENTO) forma!: string;
  @IsOptional() @IsIn(['manual', 'asaas', 'stone', 'pagarme']) provider?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) parcelas?: number;
  /** Presente só nas formas CARTAO_*. Validado como objeto aninhado. */
  @IsOptional() @ValidateNested() @Type(() => CartaoDto) cartao?: CartaoDto;
}

/** Confirmação manual (operador do PDV, ou simulação do gateway em homolog). */
export class ConfirmarPagamentoDto {
  @IsOptional() @IsUUID() pagamentoId?: string;
  @IsOptional() @IsString() gatewayId?: string;
}

/** Uma forma no split de pagamento do PDV. */
export class PagamentoPdvDto {
  @IsIn(FORMAS_PAGAMENTO) forma!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) valor!: number;
  @IsOptional() @IsString() bandeira?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) parcelas?: number;
}

// -------------------- VENDA PDV (fila unificada + split) --------------------

/** Venda no balcão (PDV) que já nasce como pedido da fila unificada.
 *  `modo` = ENTREGAR_AGORA (retirado na hora) | ENVIAR_PREPARACAO (entra na fila).
 *  Aceita SPLIT: várias formas de pagamento que devem somar o total. */
export class VendaPdvDto {
  @IsOptional() @IsUUID() operacaoId?: string;
  @IsOptional() @IsString() clienteNome?: string;
  @IsOptional() @IsString() clienteTel?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) desconto?: number;
  @IsIn(['ENTREGAR_AGORA', 'ENVIAR_PREPARACAO']) modo!: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto) itens!: ItemPedidoDto[];
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => PagamentoPdvDto) pagamentos!: PagamentoPdvDto[];
}

// -------------------- TRANSIÇÕES OPERACIONAIS --------------------

export class CancelarPedidoDto {
  @IsString() @IsNotEmpty() motivo!: string;
}
