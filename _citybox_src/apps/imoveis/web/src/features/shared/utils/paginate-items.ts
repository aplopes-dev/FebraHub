export function paginateItems<T>(
  items: readonly T[],
  page: number,
  perPage: number,
): { pageItems: T[]; page: number; perPage: number; total: number } {
  const total = items.length;
  const safePerPage = Math.max(1, Math.floor(perPage) || 1);
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (safePage - 1) * safePerPage;
  return {
    pageItems: items.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total,
  };
}
