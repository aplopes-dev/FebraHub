'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { SearchInput, toast } from '@citybox/mui/molecules';
import { FilterDrawer, FilterPills, type FilterValues } from '@/components/filters';
import { type PropertyType } from '@/features/shared/types';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog';
import type { CreateTransactionPrefill } from '@/features/transactions/types';
import { buildTransactionPrefillFromLead } from '@/features/transactions/utils/build-prefill-from-lead';
import { EMPTY_LEADS_FILTERS, LEADS_FILTER_GROUPS } from '../data/leads-filters';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import {
  useKanbanDealsQueries,
} from '../hooks/use-kanban-deals-queries';
import { useLeadsQuery } from '../hooks/use-leads-queries';
import { useLeadsReminders } from '../hooks/use-leads-reminders';
import { useSessionAgentScope } from '@/features/shared/session/hooks/use-session-agent-scope';
import { listLeads } from '../services/leads-service';
import {
  type ContactLeadDetail,
  type LeadPurpose,
  type LeadSource,
  type LeadStatus,
  type ListLeadsParams,
} from '../types';
import { exportLeadsToCSV } from '../utils/export-leads-csv';
import { ImportLeadsModal } from './import-leads-modal';
import { LeadsFeaturedPopover } from './leads-featured-popover';
import { LeadsFeaturedPropertyCard } from './leads-featured-property-card';
import { LeadsKanbanBoard } from './leads-kanban-board';
import { LeadsRemindersCard } from './leads-reminders-card';
import { LeadsRemindersPopover } from './leads-reminders-popover';
import { LeadsTable } from './leads-table';
import type { SxProps, Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

type ViewMode = 'kanban' | 'list';
const VIEW_STORAGE_KEY = 'imoveis.leads.view';
const VIEW_CHANGE_EVENT = 'imoveis-leads-view-changed';

const viewToggleIconSx = (selected: boolean): SxProps<Theme> => (theme) => ({
  width: { xs: 40, sm: 48, md: 56 },
  height: { xs: 40, sm: 48, md: 56 },
  borderRadius: 999,
  bgcolor: listifyElevatedSurface(theme),
  color: selected ? 'primary.main' : 'text.primary',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
  '&:hover': { bgcolor: 'secondary.main' },
});

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'list';
  try {
    const value = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (value === 'kanban') return 'kanban';
    return 'list';
  } catch {
    return 'list';
  }
}

function subscribeView(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(VIEW_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(VIEW_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function writeStoredView(mode: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    window.dispatchEvent(new Event(VIEW_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

function asStringList(value: FilterValues[string] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function filtersToListParams(filters: FilterValues): Pick<
  ListLeadsParams,
  'status' | 'leadSource' | 'purpose' | 'interestedPropertyType'
> {
  return {
    status: asStringList(filters.status) as LeadStatus[],
    leadSource: asStringList(filters.leadSource) as LeadSource[],
    purpose: asStringList(filters.purpose) as LeadPurpose[],
    interestedPropertyType: asStringList(
      filters.interestedPropertyType,
    ) as PropertyType[],
  };
}

function buildTransactionPrefill(
  lead: ContactLeadDetail,
  options?: {
    initialStatus?: 'PROPOSAL' | 'CONTRACT_SIGNED';
    dealId?: string;
    propertyId?: string | null;
    propertyName?: string | null;
  },
): Promise<CreateTransactionPrefill> {
  return buildTransactionPrefillFromLead(lead, options);
}

export function LeadsPageContent() {
  const { agentId, ready: scopeReady } = useSessionAgentScope();
  const { reminders } = useLeadsReminders(agentId);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_LEADS_FILTERS);
  const [createTxOpen, setCreateTxOpen] = useState(false);
  const [createTxPrefill, setCreateTxPrefill] = useState<CreateTransactionPrefill | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);

  const viewMode = useSyncExternalStore(
    subscribeView,
    readStoredView,
    () => 'list' as ViewMode,
  );

  const filterParams = useMemo(() => filtersToListParams(filters), [filters]);
  const isKanban = viewMode === 'kanban';

  const kanbanBaseFilters = useMemo(
    () => ({
      search: debouncedSearch,
      // Força carteira do logado (API também aplica; desambigua cache por usuário).
      ...(agentId ? { agentId } : {}),
    }),
    [debouncedSearch, agentId],
  );

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      page,
      perPage,
      ...filterParams,
      ...(agentId ? { agentId } : {}),
    }),
    [debouncedSearch, page, perPage, filterParams, agentId],
  );

  const {
    data: listResult,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
  } = useLeadsQuery(listParams, !isKanban && scopeReady);

  const {
    columns: kanbanColumns,
    allDeals: kanbanDeals,
    loadMore: loadMoreKanbanColumn,
    isLoading: isKanbanLoading,
    isFetching: isKanbanFetching,
  } = useKanbanDealsQueries(kanbanBaseFilters, isKanban && scopeReady);

  const isLoading = !scopeReady || (isKanban ? isKanbanLoading : isListLoading);
  const isError = isKanban ? false : isListError;
  const error = listError;
  const result = isKanban ? undefined : listResult;

  const emptyResult = {
    data: [] as ContactLeadDetail[],
    meta: {
      total: 0,
      page: listParams.page,
      perPage: listParams.perPage,
      totalPages: 1,
    },
  };
  const safeResult = result ?? emptyResult;

  const perPageOptions = useMemo(
    () => buildPerPageOptions(safeResult.meta.total),
    [safeResult.meta.total],
  );

  useEffect(() => {
    if (!perPageOptions.includes(perPage)) {
      setPerPage(perPageOptions[0] ?? DEFAULT_PER_PAGE);
      setPage(1);
    }
  }, [perPageOptions, perPage]);

  const handleViewChange = useCallback((mode: ViewMode) => {
    writeStoredView(mode);
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFiltersChange(next: FilterValues) {
    setFilters(next);
    setPage(1);
  }

  async function handlePromoteToTransaction(
    lead: ContactLeadDetail,
    options?: {
      initialStatus?: 'PROPOSAL' | 'CONTRACT_SIGNED';
      dealId?: string;
      propertyId?: string | null;
      propertyName?: string | null;
    },
  ) {
    const prefill = await buildTransactionPrefill(lead, options);
    setCreateTxPrefill(prefill);
    setCreateTxOpen(true);
  }

  async function handleExport() {
    try {
      let rows: readonly ContactLeadDetail[] = safeResult.data;
      const total = safeResult.meta.total;

      if (total > rows.length) {
        if (total > 500) {
          toast.message('Exportação parcial', {
            description: `Exportando ${rows.length} leads da página atual (total: ${total}). Refine filtros para menos de 500.`,
          });
        } else {
          const full = await listLeads({
            ...listParams,
            page: 1,
            perPage: total,
            ...(agentId ? { agentId } : {}),
          });
          rows = full.data;
        }
      }

      exportLeadsToCSV(rows);
      toast.success('CSV exportado');
    } catch {
      toast.error('Não foi possível exportar os leads');
    }
  }

  const startIndex = (safeResult.meta.page - 1) * safeResult.meta.perPage + 1;
  const boardKey = `${debouncedSearch}:${JSON.stringify(filterParams)}`;

  if (isError) {
    return (
      <Box
        sx={{
          borderRadius: '20px',
          border: 1,
          borderColor: 'error.light',
          bgcolor: (theme) => listifyElevatedSurface(theme),
          px: 3,
          py: 5,
          color: 'error.main',
          fontSize: '0.875rem',
        }}
      >
        Não foi possível carregar os leads
        {error instanceof Error ? `: ${error.message}` : '.'}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 2, sm: 2.5 },
        minWidth: 0,
        width: '100%',
        ...(isKanban
          ? {
              // Altura natural — scroll só no <main> da DashboardShell.
              gridTemplateColumns: '1fr',
            }
          : {
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'minmax(0, 1fr) minmax(280px, 320px)',
                xl: 'minmax(0, 1fr) minmax(320px, 360px)',
              },
              alignItems: 'start',
            }),
      }}
    >
      <Stack
        spacing={{ xs: 1.5, sm: 2.5 }}
        sx={{
          minWidth: 0,
          width: '100%',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            flexShrink: 0,
            flexWrap: 'wrap',
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, sm: 2 },
            px: { xs: 0, sm: 1.5 },
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.375rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            Contatos de leads
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 1.5, md: 2.5 }}
            sx={{
              flexWrap: 'wrap',
              alignItems: { xs: 'stretch', sm: 'center' },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {isKanban ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  '& > *': { flex: { xs: '1 1 0', sm: '0 0 auto' } },
                }}
              >
                <LeadsFeaturedPopover />
                <LeadsRemindersPopover reminders={reminders} />
              </Stack>
            ) : null}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              alignItems: { xs: 'stretch', sm: 'center' },
              flexWrap: 'nowrap',
            }}
          >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  '& > .MuiButton-root': {
                    flex: { xs: '1 1 0', sm: '0 0 auto' },
                    minWidth: 0,
                  },
                }}
              >
                <Button
                  type="button"
                  variant="contained"
                  color="inherit"
                  startIcon={<IosShareIcon sx={{ fontSize: 18 }} />}
                  onClick={handleExport}
                  sx={(theme) => ({
                    bgcolor: listifyElevatedSurface(theme),
                    color: 'text.primary',
                    borderRadius: { xs: '14px', sm: '20px' },
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.25, sm: 1.75 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                    '&:hover': { bgcolor: 'secondary.light' },
                  })}
                >
                  Exportar
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  color="inherit"
                  startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setImportOpen(true)}
                  sx={(theme) => ({
                    bgcolor: listifyElevatedSurface(theme),
                    color: 'text.primary',
                    borderRadius: { xs: '14px', sm: '20px' },
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.25, sm: 1.75 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                    '&:hover': { bgcolor: 'secondary.light' },
                  })}
                >
                  Importar Leads
                </Button>
              </Stack>
              <Button
                component={Link}
                href="/leads/new"
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: { xs: '14px', sm: '20px' },
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.25, sm: 1.75 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                  textTransform: 'none',
                  boxShadow: 'none',
                }}
              >
                Adicionar leads
              </Button>
            </Stack>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            flexShrink: 0,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            minHeight: { sm: 56 },
          }}
        >
          <SearchInput
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar leads..."
            sx={{
              width: { xs: '100%', sm: 320, md: 386 },
              maxWidth: '100%',
              flex: { sm: '1 1 auto' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                height: 48,
                bgcolor: (theme) => listifyElevatedSurface(theme),
                boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                '& fieldset': { border: 'none' },
              },
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: 'flex-end',
            }}
          >
            <FilterDrawer
              groups={LEADS_FILTER_GROUPS}
              values={filters}
              onValuesChange={handleFiltersChange}
            />
            <IconButton
              aria-label="Visualização em lista"
              aria-pressed={viewMode === 'list'}
              onClick={() => handleViewChange('list')}
              sx={viewToggleIconSx(viewMode === 'list')}
            >
              <ViewListIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            <IconButton
              aria-label="Visualização em kanban"
              aria-pressed={viewMode === 'kanban'}
              onClick={() => handleViewChange('kanban')}
              sx={viewToggleIconSx(viewMode === 'kanban')}
            >
              <ViewColumnIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Stack>
        </Stack>

        <Box sx={{ flexShrink: 0 }}>
          <FilterPills
            groups={LEADS_FILTER_GROUPS}
            values={filters}
            onValuesChange={handleFiltersChange}
          />
        </Box>

        {isLoading && !isKanban && !result ? (
          <Box
            sx={{
              borderRadius: '20px',
              bgcolor: 'background.paper',
              px: 3,
              py: 8,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.875rem',
            }}
          >
            Carregando leads…
          </Box>
        ) : !isKanban && safeResult.data.length === 0 ? (
          <Box
            sx={{
              borderRadius: '20px',
              bgcolor: 'background.paper',
              px: 3,
              py: 8,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
              Nenhum lead encontrado
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
              Ajuste a busca ou os filtros, ou adicione um novo lead.
            </Typography>
          </Box>
        ) : viewMode === 'list' ? (
          <Box sx={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
            <LeadsTable
              leads={safeResult.data}
              startIndex={startIndex}
              onPromoteToTransaction={handlePromoteToTransaction}
            />
            <ListifyPagination
              count={safeResult.meta.total}
              page={safeResult.meta.page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
              rowsPerPageOptions={perPageOptions}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              // Colunas com altura limitada + scroll interno; pan horizontal no mobile.
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              overflow: 'visible',
            }}
          >
            <LeadsKanbanBoard
              key={boardKey}
              deals={kanbanDeals}
              columns={kanbanColumns}
              onLoadMore={loadMoreKanbanColumn}
              isBoardFetching={isKanbanFetching}
              onPromoteToTransaction={handlePromoteToTransaction}
            />
          </Box>
        )}
      </Stack>

      <CreateTransactionDialog
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        prefill={createTxPrefill}
      />

      <ImportLeadsModal open={importOpen} onOpenChange={setImportOpen} />

      {!isKanban ? (
        <Box
          component="aside"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'minmax(0, 1fr) minmax(0, 1fr)',
              lg: '1fr',
            },
            gap: { xs: 2, sm: 2.5 },
            alignItems: 'stretch',
            minWidth: 0,
            width: '100%',
            '& > *': {
              minWidth: 0,
              width: '100%',
            },
          }}
        >
          <LeadsRemindersCard reminders={reminders} />
          <LeadsFeaturedPropertyCard />
        </Box>
      ) : null}
    </Box>
  );
}
