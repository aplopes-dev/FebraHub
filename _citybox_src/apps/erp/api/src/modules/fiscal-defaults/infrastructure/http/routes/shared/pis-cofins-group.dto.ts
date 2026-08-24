import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PIS_COFINS_CST_SUPPORTED } from '../../../../domain/entities/fiscal-group.entity';

export class UpsertPisCofinsGroupHttpDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: PIS_COFINS_CST_SUPPORTED })
  @IsIn(PIS_COFINS_CST_SUPPORTED)
  pisCst!: string;

  @ApiProperty({
    nullable: true,
    description: 'Alíquota do PIS (%). Só p/ CST tributado.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pisAliquota?: number | null;

  @ApiProperty({ enum: PIS_COFINS_CST_SUPPORTED })
  @IsIn(PIS_COFINS_CST_SUPPORTED)
  cofinsCst!: string;

  @ApiProperty({
    nullable: true,
    description: 'Alíquota do COFINS (%). Só p/ CST tributado.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cofinsAliquota?: number | null;
}

export function toPisCofinsGroupInput(dto: UpsertPisCofinsGroupHttpDto): {
  name: string;
  pisCst: string;
  pisAliquota: number | null;
  cofinsCst: string;
  cofinsAliquota: number | null;
} {
  return {
    name: dto.name,
    pisCst: dto.pisCst,
    pisAliquota: dto.pisAliquota ?? null,
    cofinsCst: dto.cofinsCst,
    cofinsAliquota: dto.cofinsAliquota ?? null,
  };
}
