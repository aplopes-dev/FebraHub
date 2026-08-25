import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class EnderecoEmitenteDto {
  @IsString() @IsNotEmpty() logradouro!: string;
  @IsString() @IsNotEmpty() numero!: string;
  @IsOptional() @IsString() complemento?: string;
  @IsString() @IsNotEmpty() bairro!: string;
  @IsString() @IsNotEmpty() municipio!: string;
  @IsString() @IsNotEmpty() cep!: string;
}

/** Atualizacao da configuracao fiscal do emitente (singleton). */
export class AtualizarFiscalConfigDto {
  @IsOptional() @IsIn(['homologacao', 'producao']) ambiente?: string;
  @IsOptional() @IsString() @IsNotEmpty() razaoSocial?: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() @IsNotEmpty() cnpj?: string;
  @IsOptional() @IsString() inscricaoEstadual?: string;
  @IsOptional() @IsString() inscricaoMunicipal?: string;
  @IsOptional() @IsIn(['1', '2', '3']) regimeTributario?: string;
  @IsOptional() endereco?: EnderecoEmitenteDto;
  @IsOptional() @IsString() uf?: string;
  @IsOptional() @IsString() codigoMunicipio?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) serieNfce?: number;
  @IsOptional() @IsBoolean() nfceHabilitada?: boolean;
}

/** Cadastro do CSC (Codigo de Seguranca do Contribuinte) gerado no portal SEFAZ-BA. */
export class DefinirCscDto {
  @IsString() @IsNotEmpty() cscId!: string;
  @IsString() @IsNotEmpty() cscToken!: string;
}

/** Senha do certificado A1 no upload (o arquivo .pfx vai como multipart). */
export class UploadCertificadoDto {
  @IsString() @IsNotEmpty() senha!: string;
  @IsOptional() @IsString() nome?: string;
}

/** Emissao de cupom (fiscal ou nao) a partir de uma venda do PDV. */
export class EmitirCupomDto {
  @IsString() @IsNotEmpty() vendaId!: string;
  /** fiscal = NFC-e (exige tudo configurado); nao_fiscal = recibo interno. */
  @IsIn(['fiscal', 'nao_fiscal']) tipo!: string;
}

export class CancelarCupomDto {
  @IsString() @IsNotEmpty() justificativa!: string;
}
