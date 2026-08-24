import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UNIT_KINDS } from '../../../../domain/entities/unit-of-measure.entity';

export class SaveUnitOfMeasureDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  abbreviation!: string;

  @ApiProperty({ enum: UNIT_KINDS })
  @IsIn(UNIT_KINDS)
  kind!: (typeof UNIT_KINDS)[number];

  @ApiPropertyOptional({ minimum: 0, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  decimalPlaces?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
