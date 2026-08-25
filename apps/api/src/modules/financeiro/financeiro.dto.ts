import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class RateioDto {
  @IsUUID() planoContaId!: string;
  @IsUUID() centroCustoId!: string;
  @Type(() => Number) @IsNumber() @Min(0) valor!: number;
}
export class LancamentoDto {
  @IsIn(['receber', 'pagar']) operacao!: string;
  @IsString() @IsNotEmpty() descricao!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) valor!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) juros?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) multa?: number;
  @IsDateString() dataCompetencia!: string;
  @IsDateString() dataVencimento!: string;
  @IsOptional() @IsString() contraparte?: string;
  @IsOptional() @IsUUID() contaBancariaId?: string;
  @IsOptional() @IsString() observacao?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RateioDto) rateios?: RateioDto[];
}
export class AtualizarLancamentoDto {
  @IsOptional() @IsString() @IsNotEmpty() descricao?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.01) valor?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) juros?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) multa?: number;
  @IsOptional() @IsDateString() dataCompetencia?: string;
  @IsOptional() @IsDateString() dataVencimento?: string;
  @IsOptional() @IsString() contraparte?: string;
  @IsOptional() @IsUUID() contaBancariaId?: string;
  @IsOptional() @IsString() observacao?: string;
}
export class PagarLancamentoDto {
  @Type(() => Number) @IsNumber() @Min(0.01) valor!: number;
  @IsDateString() pagoEm!: string;
  @IsString() @IsNotEmpty() formaPagamento!: string;
  @IsOptional() @IsUUID() contaBancariaId?: string;
}
export class ContaBancariaDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsOptional() @IsString() banco?: string;
  @IsOptional() @Type(() => Number) @IsNumber() saldoInicial?: number;
}
export class CentroCustoDto { @IsString() @IsNotEmpty() nome!: string; }
export class PlanoContaDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsUUID() grupoId!: string;
  @IsOptional() disponivelPdv?: boolean;
}
