import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsEmail,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STORE_VERTICALS } from '../../../../domain/entities/store.entity';
import { StoreAddressBodyDto } from '../shared/store-address.dto';

export class CreateStoreDto {
  @ApiProperty({ enum: [...STORE_VERTICALS] })
  @IsIn([...STORE_VERTICALS])
  vertical!: string;

  @ApiPropertyOptional({
    enum: ['odontologia', 'fisioterapia', 'nutricao'],
    description:
      'Vertente da clínica. Só lida quando vertical=Clínica. Ausente/vazio → odontologia. Inválido → 422.',
  })
  @IsOptional()
  @IsString()
  clinicStrand?: string;

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

  @ApiProperty({
    description:
      'Plano (vertical + tier) escolhido para a loja — FR-001/FR-015',
  })
  @IsUUID()
  planId!: string;

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY'] })
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle!: 'MONTHLY' | 'YEARLY';

  @ApiProperty({ description: 'Dia de vencimento da fatura (1-28)' })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay!: number;

  @ApiProperty({ enum: ['PF', 'PJ'] })
  @IsIn(['PF', 'PJ'])
  personType!: 'PF' | 'PJ';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  responsibleName!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(200)
  billingEmail!: string;

  @ApiProperty({
    description:
      'CPF ou CNPJ da loja — não precisa ser único entre lojas (FR-016)',
  })
  @IsString()
  @MaxLength(18)
  document!: string;

  @ApiPropertyOptional({
    description:
      'Razão social. Obrigatória para PJ; em PF o mapper usa o nome fantasia se omitida.',
  })
  @ValidateIf((dto: CreateStoreDto) => dto.personType === 'PJ')
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
