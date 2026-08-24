export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

export type Pagination = {
  page: number;
  perPage: number;
  skip: number;
  totalPages: number;
};

/**
 * Normaliza página/tamanho contra o total real.
 *
 * Pedir a página 99 de uma lista com 2 páginas devolve a última, não uma lista
 * vazia — o cliente que apagou registros continua vendo dados.
 */
export function resolvePagination(
  total: number,
  page?: number,
  perPage?: number,
): Pagination {
  const size = Math.min(Math.max(perPage ?? DEFAULT_PER_PAGE, 1), MAX_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(page ?? DEFAULT_PAGE, 1), totalPages);
  return {
    page: current,
    perPage: size,
    skip: (current - 1) * size,
    totalPages,
  };
}
