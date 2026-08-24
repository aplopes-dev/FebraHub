import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ContatoFornecedorDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsBoolean() principal?: boolean;
}

export class FornecedorDto {
  @IsString() @IsNotEmpty() razaoSocial!: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() documento?: string;
  @IsOptional() @IsString() inscricao?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() endereco?: string;
  @IsOptional() @IsString() cidade?: string;
  @IsOptional() @IsString() uf?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categorias?: string[];
  @IsOptional() @IsString() banco?: string;
  @IsOptional() @IsString() agencia?: string;
  @IsOptional() @IsString() conta?: string;
  @IsOptional() @IsString() chavePix?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) prazoMedioDias?: number;
  @IsOptional() @IsString() condicoesComerciais?: string;
  @IsOptional() @IsIn(['ativo', 'inativo', 'bloqueado', 'em_homologacao']) situacao?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContatoFornecedorDto)
  contatos?: ContatoFornecedorDto[];
}
