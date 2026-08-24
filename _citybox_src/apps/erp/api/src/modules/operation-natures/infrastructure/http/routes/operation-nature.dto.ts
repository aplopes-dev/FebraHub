import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ICMS_LIVRE_CONDITIONS,
  OPERATION_NATURE_GROUP_TAX_TYPES,
} from '../../../domain/entities/operation-nature.entity';

export class OperationNatureCfopRuleHttpDto {
  @ApiProperty({ example: '1102', description: 'CFOP de entrada.' })
  @IsString()
  fromCfop!: string;

  @ApiProperty({ example: '5202', description: 'CFOP de saída.' })
  @IsString()
  toCfop!: string;

  @ApiProperty({
    enum: ICMS_LIVRE_CONDITIONS,
    description: 'Condição ICMS Livre: AMBOS | SIM | NAO.',
  })
  @IsIn(ICMS_LIVRE_CONDITIONS)
  icmsLivre!: string;
}

export class OperationNatureGroupRuleHttpDto {
  @ApiProperty({ enum: OPERATION_NATURE_GROUP_TAX_TYPES })
  @IsIn(OPERATION_NATURE_GROUP_TAX_TYPES)
  taxType!: string;

  @ApiProperty()
  @IsString()
  fromGroupId!: string;

  @ApiProperty()
  @IsString()
  toGroupId!: string;
}

export class UpsertOperationNatureHttpDto {
  @ApiProperty({ maxLength: 160 })
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ nullable: true, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiProperty({ type: [OperationNatureCfopRuleHttpDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationNatureCfopRuleHttpDto)
  cfopRules!: OperationNatureCfopRuleHttpDto[];

  @ApiProperty({ type: [OperationNatureGroupRuleHttpDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationNatureGroupRuleHttpDto)
  groupRules!: OperationNatureGroupRuleHttpDto[];
}

export function toOperationNatureInput(dto: UpsertOperationNatureHttpDto) {
  return {
    name: dto.name,
    description: dto.description ?? null,
    cfopRules: dto.cfopRules.map((rule) => ({
      fromCfop: rule.fromCfop,
      toCfop: rule.toCfop,
      icmsLivre: rule.icmsLivre as (typeof ICMS_LIVRE_CONDITIONS)[number],
    })),
    groupRules: dto.groupRules.map((rule) => ({
      taxType:
        rule.taxType as (typeof OPERATION_NATURE_GROUP_TAX_TYPES)[number],
      fromGroupId: rule.fromGroupId,
      toGroupId: rule.toGroupId,
    })),
  };
}
