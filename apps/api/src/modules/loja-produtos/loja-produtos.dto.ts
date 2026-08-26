import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

const LOCAIS = ['LOJA', 'DEPOSITO'] as const;

// -------------------- ALTERAR PREÇO (PRD §40-42) --------------------
export class AlterarPrecoDto {
  @Type(() => Number) @IsNumber() @Min(0) preco!: number;
  @IsOptional() @IsString() motivo?: string;
}

// -------------------- ATUALIZAR CÓDIGO DE BARRAS --------------------
export class AtualizarCodigoBarrasDto {
  /** Novo código de barras (EAN-8, EAN-13, ITF, Code128 etc.) ou null para limpar. */
  @IsOptional() @IsString() codigoBarras?: string | null;
}

// -------------------- CATEGORIA --------------------
export class CategoriaDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() cor?: string;
  @IsOptional() @IsString() icone?: string;
  @IsOptional() @Type(() => Number) @IsNumber() ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

// -------------------- PRODUTO --------------------
export class ProdutoDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() codigoBarras?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() imagemUrl?: string;
  @IsOptional() @IsUUID() categoriaId?: string | null;
  @Type(() => Number) @IsNumber() @Min(0) preco!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) custo?: number;
  @IsOptional() @IsString() unidade?: string;
  /** produto_estoque_id do Omie (BigInt como string), vínculo opcional. */
  @IsOptional() @IsString() produtoEstoqueId?: string | null;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsBoolean() vendePdv?: boolean;
  @IsOptional() @IsBoolean() exibeCardapio?: boolean;
  @IsOptional() @IsBoolean() precisaPreparacao?: boolean;
  @IsOptional() @IsBoolean() controlaEstoque?: boolean;
  /** Quando true, permite venda mesmo sem saldo disponível (ex: pré-venda, produto digital). */
  @IsOptional() @IsBoolean() vendeSemEstoque?: boolean;
  /** Quando true, o produto aparece na seção "Destaques" do cardápio digital. */
  @IsOptional() @IsBoolean() emDestaque?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) estoqueMinimo?: number;
  @IsOptional() @Type(() => Number) @IsNumber() ordem?: number;
}

// -------------------- ESTOQUE --------------------
/** Ajuste direto de saldo em um local (entrada/saída/inventário). */
export class AjusteEstoqueDto {
  @IsIn(LOCAIS) local!: string;
  @IsIn(['entrada', 'saida', 'inventario']) tipo!: string;
  @Type(() => Number) @IsNumber() @Min(0) quantidade!: number;
  @IsOptional() @IsString() observacao?: string;
}

/** Transferência de saldo entre LOJA e DEPÓSITO. */
export class TransferenciaEstoqueDto {
  @IsIn(LOCAIS) origem!: string;
  @IsIn(LOCAIS) destino!: string;
  @Type(() => Number) @IsNumber() @Min(0.001) quantidade!: number;
  @IsOptional() @IsString() observacao?: string;
}

export class ListaProdutosQuery {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsUUID() categoriaId?: string;
  @IsOptional() @IsString() situacao?: string; // ativos | inativos | todos
}
