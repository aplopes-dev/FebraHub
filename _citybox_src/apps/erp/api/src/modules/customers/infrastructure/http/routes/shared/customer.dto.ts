import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
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
  ValidateNested,
} from 'class-validator';
import { PERSON_TYPES } from '../../../../../../shared/core/utils/document';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import {
  CUSTOMER_ADDRESS_TYPES,
  CUSTOMER_STAGES,
  type CustomerAddressInput,
} from '../../../../domain/entities/customer.entity';
import { CUSTOMER_LIST_TABS } from '../../../../domain/repositories/customer.repository.interface';

const MAX_NOTES_LENGTH = 600;

class CustomerAddressHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: CUSTOMER_ADDRESS_TYPES })
  @IsEnum(CUSTOMER_ADDRESS_TYPES)
  addressType!: (typeof CUSTOMER_ADDRESS_TYPES)[number];

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
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;
}

class CustomerWritableHttpDto {
  @ApiProperty({ enum: PERSON_TYPES, example: 'PF' })
  @IsEnum(PERSON_TYPES)
  personType!: (typeof PERSON_TYPES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'CPF (PF) ou CNPJ (PJ)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  rg?: string;

  @ApiPropertyOptional({ description: 'yyyy-mm-dd (somente PF)' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobilePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalPhones?: string[];

  @ApiPropertyOptional({ enum: CUSTOMER_STAGES, default: 'lead' })
  @IsOptional()
  @IsEnum(CUSTOMER_STAGES)
  stage?: (typeof CUSTOMER_STAGES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;

  @ApiPropertyOptional({ type: [CustomerAddressHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressHttpDto)
  addresses?: CustomerAddressHttpDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchIds?: string[];
}

export class CreateCustomerHttpDto extends CustomerWritableHttpDto {}

export class UpdateCustomerHttpDto extends CustomerWritableHttpDto {
  @ApiProperty({ type: [String], description: 'Lista completa de unidades' })
  @IsArray()
  @IsUUID('4', { each: true })
  declare branchIds: string[];
}

export class ListCustomersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_LIST_TABS, default: 'all' })
  @IsOptional()
  @IsEnum(CUSTOMER_LIST_TABS)
  tab?: (typeof CUSTOMER_LIST_TABS)[number];

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

function parseBirthDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  return new Date(`${value.trim()}T00:00:00.000Z`);
}

/** PUT: campo omitido vira null/lista vazia. */
export function toCustomerWritableInput(dto: CustomerWritableHttpDto) {
  const addresses: CustomerAddressInput[] | undefined = dto.addresses?.map(
    (address) => ({
      id: address.id,
      addressType: address.addressType,
      zipCode: address.zipCode,
      street: address.street,
      number: address.number,
      district: address.district,
      city: address.city,
      state: address.state,
      complement: address.complement,
    }),
  );

  return {
    personType: dto.personType,
    name: dto.name,
    document: dto.document ?? null,
    rg: dto.rg ?? null,
    birthDate: parseBirthDate(dto.birthDate),
    email: dto.email ?? null,
    mobilePhone: dto.mobilePhone ?? null,
    phone: dto.phone ?? null,
    additionalPhones: dto.additionalPhones ?? [],
    stage: dto.stage,
    categoryId: dto.categoryId ?? null,
    notes: dto.notes ?? null,
    addresses: addresses ?? [],
    branchIds: dto.branchIds ?? [],
  };
}
