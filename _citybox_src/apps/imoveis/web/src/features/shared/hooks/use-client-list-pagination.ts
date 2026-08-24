import { useEffect, useMemo, useState } from 'react';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import { paginateItems } from '@/features/shared/utils/paginate-items';

/**
 * Paginação client-side no padrão Listify (8, 16, …).
 * `resetKey` volta para a página 1 (busca, filtro, categoria).
 */
export function useClientListPagination<T>(
  items: readonly T[],
  resetKey = '',
) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const perPageOptions = useMemo(
    () => buildPerPageOptions(items.length),
    [items.length],
  );

  useEffect(() => {
    if (!perPageOptions.includes(perPage)) {
      setPerPage(perPageOptions[0] ?? DEFAULT_PER_PAGE);
      setPage(1);
    }
  }, [perPage, perPageOptions]);

  const paginated = useMemo(
    () => paginateItems(items, page, perPage),
    [items, page, perPage],
  );

  function handlePerPageChange(next: number) {
    setPerPage(next);
    setPage(1);
  }

  return {
    pageItems: paginated.pageItems,
    page: paginated.page,
    perPage: paginated.perPage,
    total: paginated.total,
    perPageOptions,
    setPage,
    setPerPage: handlePerPageChange,
  };
}
