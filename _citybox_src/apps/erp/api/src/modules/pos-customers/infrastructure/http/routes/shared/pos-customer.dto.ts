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
  type CustomerAddressInput,
} from '../../../../../customers/domain/entities/customer.entity';

const MAX_NOTES_LENGTH = 600;

class PosCustomerAddressHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: CUSTOMER_ADDRESS_TYPES })
  @IsEnum(CUSTOMER_ADDRESS_TYPES)
  addressType!: (typeof CUSTOMER_ADDRESS_TYPES)[number];

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
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

export class ListPosCustomersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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

export class CreatePosCustomerHttpDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;

  @ApiPropertyOptional({ type: [PosCustomerAddressHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCustomerAddressHttpDto)
  addresses?: PosCustomerAddressHttpDto[];
}

function parseBirthDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  return new Date(`${value.trim()}T00:00:00.000Z`);
}

export function toPosCustomerCreateInput(
  dto: CreatePosCustomerHttpDto,
  branchId: string,
) {
  const addresses: CustomerAddressInput[] = (dto.addresses ?? []).map(
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
    stage: 'active' as const,
    categoryId: dto.categoryId ?? null,
    notes: dto.notes ?? null,
    addresses,
    branchIds: [branchId],
  };
}
