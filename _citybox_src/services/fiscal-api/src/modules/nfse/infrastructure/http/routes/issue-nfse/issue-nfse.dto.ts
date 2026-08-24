import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class IssueNfseCustomerAddressDto {
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

class IssueNfseCustomerDto {
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
    type: IssueNfseCustomerAddressDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfseCustomerAddressDto)
  address?: IssueNfseCustomerAddressDto | null;
}

class IssueNfseServiceDto {
  @ApiProperty() @IsString() serviceDescription!: string;

  @ApiProperty({ example: '17.02' })
  @Matches(/^\d{2}\.\d{2}$/, {
    message: 'municipalServiceCode deve estar no formato NN.NN',
  })
  municipalServiceCode!: string;

  /// Código de tributação NACIONAL (`cTribNac`, 6 dígitos) — tabela distinta
  /// da municipal. Sem ele o serviço deriva do código municipal, derivação que
  /// o Sefin Nacional já rejeitou com `E0310`. Informe sempre que souber.
  @ApiProperty({ required: false, nullable: true, example: '010602' })
  @IsOptional()
  @Matches(/^\d{6}$/, {
    message: 'nationalServiceCode deve ter exatamente 6 dígitos',
  })
  nationalServiceCode?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 0.05 })
  @IsOptional()
  @IsNumber()
  issRate?: number | null;

  @ApiProperty() @IsBoolean() issWithheld!: boolean;

  /// Exigibilidade do ISS (`tribISSQN`, spec erp/018) — resolvida pelo emissor a
  /// partir do Grupo de ISSQN. Opcional; default '1' (tributável) no builder.
  @ApiProperty({ required: false, enum: ['1', '2', '3', '4'] })
  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  tribISSQN?: '1' | '2' | '3' | '4';
}

class IssueNfseItemDto {
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsNumber() @Min(0) quantity!: number;
  @ApiProperty() @IsNumber() @Min(0) unitValue!: number;
  @ApiProperty() @IsNumber() @Min(0) totalValue!: number;

  @ApiProperty({ example: '17.02' })
  @Matches(/^\d{2}\.\d{2}$/, {
    message: 'serviceCode deve estar no formato NN.NN',
  })
  serviceCode!: string;

  @ApiProperty({ required: false, nullable: true, type: Object })
  @IsOptional()
  @IsObject()
  taxJson?: Record<string, unknown> | null;
}

export class IssueNfseDto {
  @ApiProperty() @IsUUID() companyId!: string;
  @ApiProperty() @IsString() sourceSystem!: string;
  @ApiProperty() @IsString() externalReference!: string;
  @ApiProperty() @IsString() idempotencyKey!: string;

  @ApiProperty({ enum: ['HOMOLOGATION', 'PRODUCTION'], required: false })
  @IsOptional()
  @IsIn(['HOMOLOGATION', 'PRODUCTION'])
  environment?: 'HOMOLOGATION' | 'PRODUCTION';

  @ApiProperty({ type: IssueNfseCustomerDto })
  @ValidateNested()
  @Type(() => IssueNfseCustomerDto)
  customer!: IssueNfseCustomerDto;

  @ApiProperty({ type: IssueNfseServiceDto })
  @ValidateNested()
  @Type(() => IssueNfseServiceDto)
  nfse!: IssueNfseServiceDto;

  @ApiProperty({ type: [IssueNfseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueNfseItemDto)
  items!: IssueNfseItemDto[];
}
