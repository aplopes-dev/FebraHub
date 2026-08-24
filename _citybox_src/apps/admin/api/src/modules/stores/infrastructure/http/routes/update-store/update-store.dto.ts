import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreAddressBodyDto } from '../shared/store-address.dto';

/**
 * Sem `vertical` (imutável após a criação — FR-006, aplicado em `UpdateStoreUseCase`)
 * e sem `planId`/`billingCycle`/`dueDay` (troca de plano é `PATCH /v1/stores/:id/plan`, não update).
 */
export class UpdateStoreDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  tradeName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @ApiPropertyOptional({ enum: ['PF', 'PJ'] })
  @IsOptional()
  @IsIn(['PF', 'PJ'])
  personType?: 'PF' | 'PJ';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsibleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  billingEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(18)
  document?: string;

  @ApiPropertyOptional({
    description:
      'Razão social. Obrigatória para PJ; em PF o mapper usa o nome fantasia se omitida.',
  })
  @ValidateIf((dto: UpdateStoreDto) => dto.personType === 'PJ')
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  stateRegistration?: string;

  @ApiPropertyOptional({ type: StoreAddressBodyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreAddressBodyDto)
  address?: StoreAddressBodyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timezone!: string;
}
