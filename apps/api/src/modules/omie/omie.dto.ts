import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class OmieConfigDto {
  @IsOptional() @IsString() appKey?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() contaCorrente?: string;
  @IsOptional() @IsString() codigoCategoria?: string;
  @IsOptional() @IsNumber() idVendedor?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class LancarOmieDto {
  /** IDs dos pedidos a lançar. Vazio = todos os pedidos elegíveis filtrados. */
  @IsOptional() pedidoIds?: string[];
  /** Filtro de data inicial (ISO string) */
  @IsOptional() @IsString() dataInicio?: string;
  /** Filtro de data final (ISO string) */
  @IsOptional() @IsString() dataFim?: string;
}

export class ListaVendasQuery {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() statusOmie?: string;
  @IsOptional() @IsString() dataInicio?: string;
  @IsOptional() @IsString() dataFim?: string;
  @IsOptional() pagina?: string;
  @IsOptional() porPagina?: string;
}
