import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class IssueNfeCustomerAddressDto {
  @ApiProperty() @IsString() street!: string;
  @ApiProperty() @IsString() number!: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  complement?: string | null;
  @ApiProperty() @IsString() district!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() uf!: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  cityCodeIbge?: string | null;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  zipCode?: string | null;
}

class IssueNfeCustomerDto {
  @ApiProperty({ enum: ['CPF', 'CNPJ'] })
  @IsIn(['CPF', 'CNPJ'])
  documentType!: 'CPF' | 'CNPJ';

  @ApiProperty() @IsString() document!: string;
  @ApiProperty() @IsString() name!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiProperty({
    type: IssueNfeCustomerAddressDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfeCustomerAddressDto)
  address?: IssueNfeCustomerAddressDto | null;
}

const MAX_ALIQUOTA = 100;

/// PIS/COFINS resolvidos pelo emissor (spec erp/026) — ver `NfePisCofinsInput`
/// no builder XML (`nfe-xml.builder.ts`), este DTO é o espelho na fronteira HTTP.
class IssueNfePisCofinsDto {
  @ApiProperty() @IsString() cst!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_ALIQUOTA)
  aliquota?: number | null;
}

/// IPI resolvido pelo emissor (spec erp/026) — ver `NfeIpiInput` no builder XML.
class IssueNfeIpiDto {
  @ApiProperty() @IsString() cst!: string;
  @ApiProperty() @IsString() cEnq!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_ALIQUOTA)
  aliquota?: number | null;
}

class IssueNfeItemDto {
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() ncm!: string;
  @ApiProperty() @IsString() cfop!: string;
  @ApiProperty() @IsNumber() @Min(0) quantity!: number;
  @ApiProperty() @IsNumber() @Min(0) unitValue!: number;
  @ApiProperty() @IsNumber() @Min(0) totalValue!: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  cst?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  csosn?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_ALIQUOTA)
  icmsAliquota?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  origem?: string | null;

  @ApiProperty({
    type: IssueNfePisCofinsDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfePisCofinsDto)
  pis?: IssueNfePisCofinsDto | null;

  @ApiProperty({
    type: IssueNfePisCofinsDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfePisCofinsDto)
  cofins?: IssueNfePisCofinsDto | null;

  @ApiProperty({ type: IssueNfeIpiDto, required: false, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfeIpiDto)
  ipi?: IssueNfeIpiDto | null;
}

/// Um `detPag` por forma de pagamento real (spec erp/029) — mesmo shape já
/// validado pela NFC-e (`IssueNfcePaymentBodyDto`), duplicado aqui de
/// propósito: são rotas/DTOs HTTP distintos, cada um dono da sua fronteira de
/// validação (mesma convenção já usada pelos outros DTOs locais deste
/// arquivo, ex. `IssueNfeItemDto`). Opcional — sem `payments`, o builder
/// mantém o caminho legado de `tPag` único (`paymentMethodCode`).
export class IssueNfePaymentBodyDto {
  @ApiProperty({
    description:
      'tPag — código de dois dígitos da tabela da SEFAZ (01 dinheiro, 03 crédito, 04 débito, …).',
    example: '01',
  })
  @IsString()
  @Matches(/^\d{2}$/)
  method!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ description: 'xPag — obrigatório quando method=99.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  description?: string;
}

export class IssueNfeDto {
  @ApiProperty() @IsUUID() companyId!: string;
  @ApiProperty() @IsString() sourceSystem!: string;
  @ApiProperty() @IsString() externalReference!: string;
  @ApiProperty() @IsString() idempotencyKey!: string;

  @ApiProperty({ enum: ['HOMOLOGATION', 'PRODUCTION'], required: false })
  @IsOptional()
  @IsIn(['HOMOLOGATION', 'PRODUCTION'])
  environment?: 'HOMOLOGATION' | 'PRODUCTION';

  @ApiProperty() @IsString() operationNature!: string;

  @ApiProperty({ enum: ['0', '1'] })
  @IsIn(['0', '1'])
  operationType!: '0' | '1';

  @ApiProperty({ enum: ['1', '2', '3'], required: false })
  @IsOptional()
  @IsIn(['1', '2', '3'])
  destinationIndicator?: '1' | '2' | '3';

  @ApiProperty() @IsBoolean() finalConsumer!: boolean;

  @ApiProperty({ enum: ['1', '2', '3', '9'] })
  @IsIn(['1', '2', '3', '9'])
  presenceIndicator!: '1' | '2' | '3' | '9';

  @ApiProperty() @IsString() paymentMethodCode!: string;

  @ApiPropertyOptional({
    type: [IssueNfePaymentBodyDto],
    description:
      'Um detPag por forma de pagamento real do pedido (spec erp/029). Quando presente, tem precedência sobre paymentMethodCode para o grupo pag — este último continua obrigatório por compatibilidade, mas só é usado como detPag único quando payments vier vazio/ausente.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueNfePaymentBodyDto)
  payments?: IssueNfePaymentBodyDto[];

  @ApiProperty({ type: IssueNfeCustomerDto })
  @ValidateNested()
  @Type(() => IssueNfeCustomerDto)
  customer!: IssueNfeCustomerDto;

  @ApiProperty({ type: [IssueNfeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueNfeItemDto)
  items!: IssueNfeItemDto[];
}
