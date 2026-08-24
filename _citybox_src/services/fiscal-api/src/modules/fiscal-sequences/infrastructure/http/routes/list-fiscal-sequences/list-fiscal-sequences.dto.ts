import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;

export class ListFiscalSequencesQueryDto {
  @ApiPropertyOptional({
    enum: ENVIRONMENTS,
    description: 'Filtra por ambiente. Ausente = todos.',
  })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: (typeof ENVIRONMENTS)[number];
}
