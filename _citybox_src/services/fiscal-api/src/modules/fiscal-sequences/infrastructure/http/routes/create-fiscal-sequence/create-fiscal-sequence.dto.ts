import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const DOCUMENT_TYPES = ['NFE', 'NFCE', 'NFSE'] as const;
const ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;

export class CreateFiscalSequenceDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];

  @ApiProperty({ description: 'Série (1–3 dígitos; ex.: "1" ou "001").' })
  @IsString()
  @Matches(/^[0-9]{1,3}$/, {
    message: 'series deve ter 1 a 3 dígitos numéricos',
  })
  series!: string;

  @ApiPropertyOptional({
    description: 'Número atual inicial (>= 0).',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialNumber?: number;

  @ApiProperty({ enum: ENVIRONMENTS })
  @IsIn(ENVIRONMENTS)
  environment!: (typeof ENVIRONMENTS)[number];
}
