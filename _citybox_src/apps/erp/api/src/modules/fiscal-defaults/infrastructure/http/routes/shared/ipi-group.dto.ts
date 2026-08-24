import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IPI_CST_SUPPORTED } from '../../../../domain/entities/fiscal-group.entity';
import { IPI_ENQUADRAMENTO_CODES } from '../../../../domain/ipi-enquadramento.table';

export class UpsertIpiGroupHttpDto {
  @ApiProperty({ maxLength: 120 })
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    enum: IPI_CST_SUPPORTED,
    description:
      'CST de IPI de saída: 50/99 tributado (IPITrib), 51–55 não tributado (IPINT).',
  })
  @IsIn(IPI_CST_SUPPORTED)
  ipiCst!: string;

  @ApiProperty({
    enum: IPI_ENQUADRAMENTO_CODES,
    description:
      'Código de Enquadramento Legal do IPI (cEnq), tabela versionada.',
  })
  @IsIn(IPI_ENQUADRAMENTO_CODES)
  ipiEnquadramento!: string;

  @ApiProperty({
    nullable: true,
    description:
      'Percentual do IPI (%). Obrigatório só para CST tributado (50/99).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ipiRate?: number | null;
}

export function toIpiGroupInput(dto: UpsertIpiGroupHttpDto): {
  name: string;
  ipiCst: string;
  ipiEnquadramento: string;
  ipiRate: number | null;
} {
  return {
    name: dto.name,
    ipiCst: dto.ipiCst,
    ipiEnquadramento: dto.ipiEnquadramento,
    ipiRate: dto.ipiRate ?? null,
  };
}
