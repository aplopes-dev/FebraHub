import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PERSON_TYPES } from '../../../../../../../shared/core/utils/document';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import { CARRIER_DELIVERY_TYPES } from '../../../../domain/entities/carrier.entity';
import { CARRIER_LIST_TABS } from '../../../../domain/repositories/carrier.repository.interface';

class CarrierAddressHttpDto {
  @ApiPropertyOptional({ example: '45650-100' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ example: 'Ilhéus' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;
}

/**
 * Criar e atualizar recebem os mesmos campos: na transportadora, ao contrário
 * da unidade, documento e tipo de pessoa são corrigíveis (ver a entidade).
 */
class CarrierWritableHttpDto extends CarrierAddressHttpDto {
  @ApiProperty({ enum: PERSON_TYPES, example: 'PJ' })
  @IsEnum(PERSON_TYPES)
  personType!: (typeof PERSON_TYPES)[number];

  @ApiProperty({
    enum: CARRIER_DELIVERY_TYPES,
    example: 'transportadora',
    description: 'Transportadora terceirizada ou entregador autônomo',
  })
  @IsEnum(CARRIER_DELIVERY_TYPES)
  deliveryType!: (typeof CARRIER_DELIVERY_TYPES)[number];

  @ApiProperty({ description: 'Nome da transportadora (fantasia, para PJ)' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Razão social' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiProperty({ description: 'CNPJ (PJ) ou CPF (PF)' })
  @IsString()
  @MaxLength(20)
  document!: string;

  @ApiPropertyOptional({
    description: 'Isenta de ICMS no frete',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  icmsExempt?: boolean;

  @ApiPropertyOptional({
    description: 'Registrar como transportador na NF-e',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  registerInNfe?: boolean;

  @ApiPropertyOptional({ description: 'Inscrição estadual' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  stateRegistration?: string;

  @ApiPropertyOptional({
    description:
      'Isenta de inscrição estadual. Quando true, a inscrição enviada é descartada.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stateExempt?: boolean;

  @ApiPropertyOptional({ description: 'Inscrição municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  municipalRegistration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  commercialPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobilePhone?: string;

  @ApiPropertyOptional({
    description: 'Unidades da organização em que a transportadora atende',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchIds?: string[];
}

export class CreateCarrierHttpDto extends CarrierWritableHttpDto {}

/** Semântica de PUT: campo omitido é limpo, não preservado. */
export class UpdateCarrierHttpDto extends CarrierWritableHttpDto {}

/**
 * Traduz o DTO HTTP para a entrada do use case: `undefined` vira `null`
 * (semântica de PUT).
 *
 * Criar e atualizar usam a mesma tradução — duplicá-la nas duas rotas é como
 * um campo novo acaba gravando só em uma delas.
 */
export function toCarrierWritableInput(dto: CarrierWritableHttpDto) {
  return {
    personType: dto.personType,
    deliveryType: dto.deliveryType,
    name: dto.name,
    legalName: dto.legalName ?? null,
    document: dto.document,
    icmsExempt: dto.icmsExempt ?? false,
    registerInNfe: dto.registerInNfe ?? false,
    stateRegistration: dto.stateRegistration ?? null,
    stateExempt: dto.stateExempt ?? false,
    municipalRegistration: dto.municipalRegistration ?? null,
    email: dto.email ?? null,
    commercialPhone: dto.commercialPhone ?? null,
    mobilePhone: dto.mobilePhone ?? null,
    zipCode: dto.zipCode ?? null,
    street: dto.street ?? null,
    number: dto.number ?? null,
    complement: dto.complement ?? null,
    district: dto.district ?? null,
    city: dto.city ?? null,
    state: dto.state ?? null,
    branchIds: dto.branchIds ?? [],
  };
}

export class ListCarriersQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome, documento ou e-mail' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: CARRIER_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsEnum(CARRIER_LIST_TABS)
  tab?: (typeof CARRIER_LIST_TABS)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
