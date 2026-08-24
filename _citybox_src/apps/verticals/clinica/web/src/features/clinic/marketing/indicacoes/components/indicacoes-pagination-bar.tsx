'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';

export const INDICACOES_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type IndicacoesPageSize = (typeof INDICACOES_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_INDICACOES_PAGE_SIZE: IndicacoesPageSize = 20;

type IndicacoesPaginationBarProps = {
  page: number;
  pageSize: IndicacoesPageSize;
  total: number;
  totalPages: number;
  entitySingular: string;
  entityPlural: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: IndicacoesPageSize) => void;
};

function getVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 2) {
    return page === 1 ? [1, 'ellipsis', totalPages] : [1, 2, 'ellipsis', totalPages];
  }

  if (page >= totalPages - 1) {
    return page === totalPages
      ? [1, 'ellipsis', totalPages]
      : [1, 'ellipsis', totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', page, 'ellipsis', totalPages];
}

/** Barra de paginação padrão da clínica (10/20/50/100 + Anterior/Próxima). */
export function IndicacoesPaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  entitySingular,
  entityPlural,
  onPageChange,
  onPageSizeChange,
}: IndicacoesPaginationBarProps) {
  if (total === 0) return null;

  const safeTotalPages = Math.max(totalPages, 1);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const visiblePages = getVisiblePages(page, safeTotalPages);
  const entityLabel = total === 1 ? entitySingular : entityPlural;

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:gap-4">
      <div className="flex items-center justify-between gap-3 xl:contents">
        <p className="justify-self-start whitespace-nowrap text-sm text-muted-foreground">
          <span className="xl:hidden">
            {start}–{end} de {total}
          </span>
          <span className="hidden xl:inline">
            Exibindo {start}–{end} de {total} {entityLabel}
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-2 xl:order-last xl:justify-self-end">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            <span className="xl:hidden">Por página</span>
            <span className="hidden xl:inline">Linhas por página</span>
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as IndicacoesPageSize)
            }
          >
            <SelectTrigger className="h-9 w-20 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDICACOES_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination className="mx-0 w-full justify-center xl:w-auto xl:justify-self-center">
        <PaginationContent className="flex-nowrap gap-0.5">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Anterior"
              aria-label="Página anterior"
              onClick={(event) => {
                event.preventDefault();
                if (page > 1) onPageChange(page - 1);
              }}
            />
          </PaginationItem>

          <PaginationItem className="xl:hidden">
            <span
              className="px-1.5 text-sm font-medium tabular-nums text-foreground"
              aria-current="page"
            >
              {page}/{safeTotalPages}
            </span>
          </PaginationItem>

          {visiblePages.map((entry, index) =>
            entry === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`} className="hidden xl:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry} className="hidden xl:block">
                <PaginationLink
                  href="#"
                  isActive={entry === page}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(entry);
                  }}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              text="Próxima"
              aria-label="Próxima página"
              onClick={(event) => {
                event.preventDefault();
                if (page < safeTotalPages) onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
