import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * PaginacaoDto — base compartilhada para os DTOs de listagem.
 *
 * Antes cada módulo redeclarava `pagina`/`porPagina`/`busca` com limites e
 * defaults próprios (turma.dto, comercial.dto x2, notificacoes.dto…). Agora um
 * filtro de lista só faz `extends PaginacaoDto` e ganha os três campos com a
 * MESMA validação (pagina>=1, porPagina 1..200, default 50).
 *
 * Casa com o envelope que o front (`ListaCrud<T>`) espera — ver respostaPaginada.
 */
export class PaginacaoDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  porPagina?: number = 50;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  busca?: string;
}

/** Envelope padronizado de lista paginada — o mesmo shape em toda a API. */
export interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  por_pagina: number;
}

/** Calcula `skip`/`take` do Prisma a partir do DTO, aplicando os defaults. */
export function fatiar(p: { pagina?: number; porPagina?: number }): {
  pagina: number;
  porPagina: number;
  skip: number;
  take: number;
} {
  const pagina = Math.max(1, p.pagina ?? 1);
  const porPagina = Math.min(200, Math.max(1, p.porPagina ?? 50));
  return { pagina, porPagina, skip: (pagina - 1) * porPagina, take: porPagina };
}

/** Monta o envelope `{ itens, total, pagina, por_pagina }` que o front consome. */
export function respostaPaginada<T>(
  itens: T[],
  total: number,
  pagina: number,
  porPagina: number,
): RespostaPaginada<T> {
  return { itens, total, pagina, por_pagina: porPagina };
}
