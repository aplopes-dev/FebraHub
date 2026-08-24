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

export const PATIENT_BODY_METRIC_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export type PatientBodyMetricPageSize =
  (typeof PATIENT_BODY_METRIC_PAGE_SIZE_OPTIONS)[number];

type PatientBodyMetricsPaginationBarProps = {
  page: number;
  pageSize: PatientBodyMetricPageSize;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PatientBodyMetricPageSize) => void;
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

export function PatientBodyMetricsPaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PatientBodyMetricsPaginationBarProps) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="flex items-center justify-between gap-3 sm:contents">
        <p className="justify-self-start whitespace-nowrap text-sm text-muted-foreground">
          <span className="xl:hidden">
            {start}–{end} de {total}
          </span>
          <span className="hidden xl:inline">
            Exibindo {start}–{end} de {total} medição{total === 1 ? '' : 'ões'}
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:order-last sm:justify-self-end">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            <span className="xl:hidden">Por página</span>
            <span className="hidden xl:inline">Linhas por página</span>
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as PatientBodyMetricPageSize)
            }
          >
            <SelectTrigger className="h-9 w-20 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PATIENT_BODY_METRIC_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination className="mx-0 w-auto justify-center sm:justify-self-center">
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
              {page}/{totalPages}
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
                if (page < totalPages) onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
