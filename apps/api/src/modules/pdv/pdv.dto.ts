import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class AbrirCaixaDto {
  @IsUUID() terminalId!: string;
  @Type(() => Number) @IsNumber() @Min(0) fundoAbertura!: number;
}
export class FecharCaixaDto {
  @Type(() => Number) @IsNumber() @Min(0) contadoDinheiro!: number;
  @IsOptional() @IsString() observacoes?: string;
}
export class MovimentoCaixaDto {
  @IsIn(['sangria', 'reforco']) tipo!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) valor!: number;
  @IsOptional() @IsString() motivo?: string;
}

export class ItemVendaDto {
  @IsOptional() @IsUUID() produtoId?: string; // UUID do loja_produtos
  @IsString() @IsNotEmpty() descricao!: string;
  @Type(() => Number) @IsNumber() @Min(0.001) quantidade!: number;
  @Type(() => Number) @IsNumber() @Min(0) precoUnit!: number;
}
export class PagamentoVendaDto {
  @IsString() @IsNotEmpty() formaPagamento!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) valor!: number;
  @IsOptional() @IsString() bandeira?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) parcelas?: number;
}
export class RegistrarVendaDto {
  @IsUUID() sessaoId!: string;
  @IsOptional() @IsString() clienteNome?: string;
  @IsOptional() @IsString() clienteDocumento?: string;
  @IsOptional() @IsIn(['pdv', 'delivery']) canal?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) desconto?: number;
  @IsOptional() @IsString() observacoes?: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => ItemVendaDto) itens!: ItemVendaDto[];
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => PagamentoVendaDto) pagamentos!: PagamentoVendaDto[];
}
export class CancelarVendaDto {
  @IsString() @IsNotEmpty() motivo!: string;
}
