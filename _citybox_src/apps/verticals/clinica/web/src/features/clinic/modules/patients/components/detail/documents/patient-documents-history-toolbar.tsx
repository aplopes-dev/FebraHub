'use client';

import { SearchInput } from '@citybox/ui/molecules';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@citybox/ui/atoms';
import type { PatientDocumentsListMeta } from '../../../types/patient-documents-api';

type PatientDocumentsHistoryToolbarProps = {
  meta: PatientDocumentsListMeta;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
};

export function PatientDocumentsHistoryToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  meta,
  onPageChange,
  hideSearch = false,
}: PatientDocumentsHistoryToolbarProps) {
  const hasPagination = meta.totalPages > 1;
  const showSearch = !hideSearch && onSearchChange !== undefined;

  if (!showSearch && !hasPagination) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showSearch ? (
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      ) : null}

      {hasPagination ? (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (meta.page > 1) onPageChange(meta.page - 1);
                }}
                aria-disabled={meta.page <= 1}
                className={meta.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (meta.page < meta.totalPages) onPageChange(meta.page + 1);
                }}
                aria-disabled={meta.page >= meta.totalPages}
                className={
                  meta.page >= meta.totalPages ? 'pointer-events-none opacity-50' : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

export const PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE = 10;

export const DEFAULT_PATIENT_DOCUMENTS_LIST_META: PatientDocumentsListMeta = {
  total: 0,
  page: 1,
  perPage: PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
  totalPages: 0,
};
