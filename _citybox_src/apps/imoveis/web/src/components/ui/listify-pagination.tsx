'use client';

import TablePagination from '@mui/material/TablePagination';
import { Box } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { buildPerPageOptions, DEFAULT_PER_PAGE } from '@/features/shared/utils/build-per-page-options';
import { useScrollListToTopOnPageChange } from '@/lib/use-scroll-list-to-top-on-page-change';

type ListifyPaginationProps = {
  count: number;
  /** Página 1-based, igual às listagens da API. */
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  rowsPerPageOptions?: readonly number[];
  listRef?: { readonly current: HTMLElement | null };
};

/**
 * Paginação Listify — mesma caixa usada em Leads e Imóveis
 * (TablePagination centralizado, múltiplos de 8, labels em PT-BR).
 * Ao mudar de página, volta ao topo da lista (scroller da casca, modal ou window).
 */
export function ListifyPagination({
  count,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  rowsPerPageOptions,
  listRef,
}: ListifyPaginationProps) {
  useScrollListToTopOnPageChange(page, listRef);

  if (count <= 0) return null;

  const options = [...(rowsPerPageOptions ?? buildPerPageOptions(count))];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        mt: 2,
        borderRadius: '16px',
        bgcolor: (theme) => listifyElevatedSurface(theme),
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      }}
    >
      <TablePagination
        component="div"
        count={count}
        page={Math.max(page - 1, 0)}
        rowsPerPage={perPage}
        onPageChange={(_, nextPage) => onPageChange(nextPage + 1)}
        onRowsPerPageChange={(event) => {
          onPerPageChange(Number(event.target.value));
        }}
        rowsPerPageOptions={options.length > 0 ? options : [DEFAULT_PER_PAGE]}
        labelRowsPerPage="Por página"
        labelDisplayedRows={({ from, to, count: total }) =>
          total === -1 ? `${from}–${to}` : `${from}–${to} de ${total}`
        }
        getItemAriaLabel={(type) => {
          if (type === 'first') return 'Primeira página';
          if (type === 'last') return 'Última página';
          if (type === 'next') return 'Próxima página';
          return 'Página anterior';
        }}
        sx={{
          border: 0,
          width: '100%',
          bgcolor: 'transparent',
          '.MuiToolbar-root': {
            minHeight: 56,
            px: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: { xs: 0.75, sm: 1.5 },
            rowGap: 0,
          },
          '.MuiTablePagination-spacer': {
            display: 'none',
          },
          '.MuiTablePagination-toolbar > *': {
            margin: 0,
          },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            margin: 0,
            color: 'text.secondary',
            fontSize: '0.875rem',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          },
          '.MuiTablePagination-input': {
            mr: { xs: 0.5, sm: 1 },
            ml: 0.5,
          },
          '.MuiTablePagination-actions': {
            ml: { xs: 0.25, sm: 0.5 },
          },
        }}
      />
    </Box>
  );
}
