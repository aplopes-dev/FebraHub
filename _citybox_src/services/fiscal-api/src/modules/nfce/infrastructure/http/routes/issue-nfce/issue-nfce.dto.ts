import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class IssueNfceConsumerBodyDto {
  @ApiProperty({ example: '12345678900' })
  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'document deve ter 11 (CPF) ou 14 (CNPJ) dígitos',
  })
  document!: string;

  @ApiProperty({ enum: ['CPF', 'CNPJ'] })
  @IsIn(['CPF', 'CNPJ'])
  documentType!: 'CPF' | 'CNPJ';

  @ApiPropertyOptional({
    description:
      'Normalmente ausente: no balcão o consumidor costuma informar só o documento.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}

export class IssueNfceItemBodyDto {
  @ApiProperty({ example: 'CIMENTO CP II 50KG' })
  @IsString()
  @Length(1, 120)
  description!: string;

  @ApiProperty({ example: '25232910' })
  @IsString()
  @Matches(/^\d{8}$/)
  ncm!: string;

  @ApiProperty({ example: '5102' })
  @IsString()
  @Matches(/^\d{4}$/)
  cfop!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 42.5 })
  @IsNumber()
  @IsPositive()
  unitValue!: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @IsPositive()
  totalValue!: number;

  @ApiPropertyOptional({ description: 'CST — Regime Normal.' })
  @IsOptional()
  @IsString()
  cst?: string;

  @ApiPropertyOptional({ description: 'CSOSN — Simples Nacional.' })
  @IsOptional()
  @IsString()
  csosn?: string;
}

export class IssueNfcePaymentBodyDto {
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

  /// A SEFAZ exige o grupo `card` em cartão (rejeição 391). O padrão `2`
  /// cobre a maquininha à parte, que é o caso comum de balcão.
  @ApiPropertyOptional({
    enum: ['1', '2'],
    description:
      'tpIntegra — só para cartão (03/04). 1 = TEF/POS integrado, 2 = não integrado (padrão).',
  })
  @IsOptional()
  @IsIn(['1', '2'])
  cardIntegration?: '1' | '2';
}

export class IssueNfceBodyDto {
  @ApiProperty({ example: 'pdv' })
  @IsString()
  @Length(1, 40)
  sourceSystem!: string;

  @ApiProperty({ example: 'venda-001' })
  @IsString()
  @Length(1, 60)
  externalReference!: string;

  @ApiProperty({ example: 'venda-001' })
  @IsString()
  @Length(1, 60)
  idempotencyKey!: string;

  /// ⚠️ Sem `PRODUCTION` no exemplo, e recusado em runtime pelo provider (424):
  /// o endpoint de produção não tem valor padrão configurado, por decisão
  /// deliberada deste serviço.
  @ApiPropertyOptional({ enum: ['HOMOLOGATION', 'PRODUCTION'] })
  @IsOptional()
  @IsIn(['HOMOLOGATION', 'PRODUCTION'])
  environment?: 'HOMOLOGATION' | 'PRODUCTION';

  @ApiPropertyOptional({ default: 'VENDA AO CONSUMIDOR' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  operationNature?: string;

  /// Ausente na venda de balcão comum. Passa a ser exigido acima do limite
  /// estadual — a API responde 422 dizendo o limite.
  @ApiPropertyOptional({ type: IssueNfceConsumerBodyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfceConsumerBodyDto)
  consumer?: IssueNfceConsumerBodyDto;

  @ApiProperty({ type: [IssueNfceItemBodyDto] })
  @IsArray()
  @ArrayMinSize(1)
  // Limite do próprio leiaute (`det` tem maxOccurs=990). Recusar aqui dá
  // mensagem legível em vez de rejeição por schema.
  @ArrayMaxSize(990)
  @ValidateNested({ each: true })
  @Type(() => IssueNfceItemBodyDto)
  items!: IssueNfceItemBodyDto[];

  @ApiProperty({
    type: [IssueNfcePaymentBodyDto],
    description:
      'Lista: parte em cartão e resto em dinheiro é rotina no varejo. O troco é calculado a partir do excedente em dinheiro.',
  })
  @IsArray()
  @ArrayMinSize(1)
  // `detPag` tem maxOccurs=100 no XSD.
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => IssueNfcePaymentBodyDto)
  payments!: IssueNfcePaymentBodyDto[];
}
