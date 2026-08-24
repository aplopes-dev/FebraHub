import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class IssueNfseCustomerAddressHttpDto {
  @ApiProperty() @IsString() street!: string;
  @ApiProperty() @IsString() number!: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  complement?: string | null;
  @ApiProperty() @IsString() district!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() uf!: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  cityCodeIbge?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  zipCode?: string | null;
}

class IssueNfseCustomerHttpDto {
  @ApiProperty({ enum: ['CPF', 'CNPJ'] })
  @IsIn(['CPF', 'CNPJ'])
  documentType!: 'CPF' | 'CNPJ';

  @ApiProperty() @IsString() @MinLength(1) document!: string;
  @ApiProperty() @IsString() @MinLength(1) name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({
    type: IssueNfseCustomerAddressHttpDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfseCustomerAddressHttpDto)
  address?: IssueNfseCustomerAddressHttpDto | null;
}

export class IssueNfseHttpDto {
  // ⚠️ `companyId` NÃO vem do cliente — o erp-api resolve o Emitente pelo CNPJ da
  // organização (isolamento de tenant, spec erp/018).

  @ApiProperty({ description: 'Grupo de ISSQN escolhido.' })
  @IsString()
  @MinLength(1)
  issqnGroupId!: string;

  @ApiProperty({
    description: 'Referência da operação do ERP (base da idempotência).',
  })
  @IsString()
  @MinLength(1)
  externalReference!: string;

  @ApiProperty({ type: IssueNfseCustomerHttpDto })
  @ValidateNested()
  @Type(() => IssueNfseCustomerHttpDto)
  customer!: IssueNfseCustomerHttpDto;

  @ApiProperty() @IsString() @MinLength(1) serviceDescription!: string;

  @ApiProperty({ description: 'Valor do serviço (R$).' })
  @IsNumber()
  @Min(0)
  totalValue!: number;

  @ApiProperty({ description: 'Há retenção de ISS?' })
  @IsBoolean()
  issWithheld!: boolean;
}
