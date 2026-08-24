import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional } from 'class-validator';

const MODELS = ['NFE', 'NFCE', 'NFSE'] as const;

/// Query da consulta de status. `models` opcional (FR-001a): ausente = os três.
export class CheckStatusQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro opcional de modelos. Ausente = os três. Lista separada por vírgula, ex.: `NFCE` ou `NFE,NFCE`.',
    enum: MODELS,
    isArray: true,
  })
  @IsOptional()
  // Query chega como string ("NFE,NFCE") ou string única; normalizamos para
  // array de maiúsculas antes de validar.
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw
      .map((item) => String(item).trim().toUpperCase())
      .filter((item) => item.length > 0);
  })
  @IsArray()
  @IsIn(MODELS, {
    each: true,
    message: 'models deve conter apenas NFE, NFCE ou NFSE',
  })
  models?: Array<(typeof MODELS)[number]>;

  @ApiPropertyOptional({
    enum: ['HOMOLOGATION', 'PRODUCTION'],
    default: 'HOMOLOGATION',
    description: 'Só HOMOLOGATION é aceito; PRODUCTION é recusado (424).',
  })
  @IsOptional()
  @IsIn(['HOMOLOGATION', 'PRODUCTION'])
  environment?: 'HOMOLOGATION' | 'PRODUCTION';
}
