import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class IssueNfeCustomerAddressHttpDto {
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

class IssueNfeCustomerHttpDto {
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
    type: IssueNfeCustomerAddressHttpDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssueNfeCustomerAddressHttpDto)
  address?: IssueNfeCustomerAddressHttpDto | null;
}

export class IssueNfeHttpDto {
  @ApiProperty({ description: 'Pedido de venda que origina a emissão.' })
  @IsString()
  @MinLength(1)
  saleOrderId!: string;

  @ApiProperty({ type: IssueNfeCustomerHttpDto })
  @ValidateNested()
  @Type(() => IssueNfeCustomerHttpDto)
  customer!: IssueNfeCustomerHttpDto;
}
