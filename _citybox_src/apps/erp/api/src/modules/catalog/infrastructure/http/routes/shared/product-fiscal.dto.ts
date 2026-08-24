import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FiscalGroupFieldDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  value!: string;

  @ApiProperty()
  @IsBoolean()
  applyToAll!: boolean;
}

export class FiscalInfoDto {
  @ApiProperty()
  @IsString()
  @MaxLength(16)
  ncm!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(8)
  origin!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  netWeightKg!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  grossWeightKg!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  cest?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fcpPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fcpStPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fcpStRetainedPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  cstIbsCbs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxClassification?: string;
}

export class FiscalGroupDto {
  @ApiProperty({ type: FiscalGroupFieldDto })
  @ValidateNested()
  @Type(() => FiscalGroupFieldDto)
  icms!: FiscalGroupFieldDto;

  @ApiProperty({ type: FiscalGroupFieldDto })
  @ValidateNested()
  @Type(() => FiscalGroupFieldDto)
  pisCofins!: FiscalGroupFieldDto;

  @ApiProperty({ type: FiscalGroupFieldDto })
  @ValidateNested()
  @Type(() => FiscalGroupFieldDto)
  ipi!: FiscalGroupFieldDto;

  @ApiProperty({ type: FiscalGroupFieldDto })
  @ValidateNested()
  @Type(() => FiscalGroupFieldDto)
  cfop!: FiscalGroupFieldDto;

  // Opcional para tolerar payloads anteriores à feature 014; ausente = grupo vazio.
  @ApiPropertyOptional({ type: FiscalGroupFieldDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiscalGroupFieldDto)
  issqn?: FiscalGroupFieldDto;
}

export class FiscalUnitDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  pisCofins?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cfop?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  issqn?: string;
}

export class UpsertFiscalParametersHttpDto {
  @ApiProperty({ type: FiscalInfoDto })
  @ValidateNested()
  @Type(() => FiscalInfoDto)
  info!: FiscalInfoDto;

  @ApiProperty({ type: FiscalGroupDto })
  @ValidateNested()
  @Type(() => FiscalGroupDto)
  group!: FiscalGroupDto;

  @ApiPropertyOptional({
    nullable: true,
    description: 'FK do grupo de PIS/COFINS (spec erp/015) ou null.',
  })
  @IsOptional()
  @IsUUID()
  pisCofinsGroupId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'FK do grupo de ICMS (spec erp/016) ou null.',
  })
  @IsOptional()
  @IsUUID()
  icmsGroupId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'FK do grupo de ISSQN (spec erp/018) ou null.',
  })
  @IsOptional()
  @IsUUID()
  issqnGroupId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'FK do grupo de IPI (spec erp/019) ou null.',
  })
  @IsOptional()
  @IsUUID()
  ipiGroupId?: string | null;

  @ApiProperty({ type: [FiscalUnitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FiscalUnitDto)
  units!: FiscalUnitDto[];
}
