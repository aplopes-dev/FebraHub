import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import {
  PAYMENT_METHOD_LIST_TABS,
  type PaymentMethodListTab,
} from '../../../../domain/repositories/payment-method.repository.interface';

const MAX_NAME_LENGTH = 60;
const MAX_FISCAL_CODE_LENGTH = 10;
const MAX_INSTALLMENT_PERMISSION_LENGTH = 40;

export class CreatePaymentMethodHttpDto {
  @ApiProperty({ example: 'PIX' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @ApiPropertyOptional({ example: '17', description: 'Código tPag da NF-e' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_FISCAL_CODE_LENGTH)
  fiscalCode?: string | null;

  @ApiPropertyOptional({ example: 'Não permitir' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_INSTALLMENT_PERMISSION_LENGTH)
  installmentPermission?: string | null;
}

export class UpdatePaymentMethodHttpDto extends CreatePaymentMethodHttpDto {}

export class ListPaymentMethodsQueryDto {
  @ApiPropertyOptional({ enum: PAYMENT_METHOD_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(PAYMENT_METHOD_LIST_TABS)
  tab?: PaymentMethodListTab;

  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
