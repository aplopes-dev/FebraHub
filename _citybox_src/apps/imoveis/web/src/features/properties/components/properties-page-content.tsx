'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import IosShareIcon from '@mui/icons-material/IosShare';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Box, Button, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { SearchInput, toast } from '@citybox/mui/molecules';
import {
  FilterDrawer,
  FilterPills,
  type FilterValues,
} from '@/components/filters';
import {
  EMPTY_PROPERTIES_FILTERS,
  PROPERTIES_FILTER_GROUPS,
} from '../data/properties-filters';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { usePropertiesQuery } from '../hooks/use-properties-queries';
import { useSessionAgentScope } from '@/features/shared/session/hooks/use-session-agent-scope';
import { getAgentDisplayName } from '@/features/shared/constants/agents';
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { downloadCsv } from '@/features/shared/utils/download-csv';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import { listProperties } from '../services/properties-service';
import type { ListingType, ListPropertiesParams, PropertyListing } from '../types';
import { LISTING_TYPE_LABEL } from '../types';
import type { PropertyStatus, PropertyType } from '@/features/shared/types';
import type { SxProps, Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { PropertyCard } from './property-card';
import { PropertiesTable } from './properties-table';

type ViewMode = 'grid' | 'list';
const VIEW_STORAGE_KEY = 'imoveis.properties.view';
const VIEW_CHANGE_EVENT = 'imoveis-properties-view-changed';

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
  if (typeof window === 'undefined') return 'grid';
  try {
    const value = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return value === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
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
  ListPropertiesParams,
  'status' | 'type' | 'listingType' | 'negotiable'
> {
  const negotiable = asStringList(filters.negotiable).filter(
    (value): value is 'yes' | 'no' => value === 'yes' || value === 'no',
  );

  return {
    status: asStringList(filters.status) as PropertyStatus[],
    type: asStringList(filters.type) as PropertyType[],
    listingType: asStringList(filters.listingType) as ListingType[],
    negotiable,
  };
}

export function PropertiesPageContent() {
  const { agentId, ready: scopeReady } = useSessionAgentScope();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_PROPERTIES_FILTERS);
  const debouncedSearch = useDebouncedValue(search, 400);

  const viewMode = useSyncExternalStore(subscribeView, readStoredView, () => 'grid' as ViewMode);

  const filterParams = useMemo(() => filtersToListParams(filters), [filters]);

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

  const { data: result, isLoading: queryLoading } = usePropertiesQuery(
    listParams,
    scopeReady,
  );
  const isLoading = !scopeReady || queryLoading;

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

  async function handleExport() {
    try {
      let rows: readonly PropertyListing[] = items;
      const total = meta.total;

      if (total > rows.length) {
        if (total > 500) {
          toast.message('Exportação parcial', {
            description: `Exportando ${rows.length} imóveis da página atual (total: ${total}). Refine filtros para menos de 500.`,
          });
        } else {
          const full = await listProperties({
            search: debouncedSearch,
            page: 1,
            perPage: total,
            ...filterParams,
            ...(agentId ? { agentId } : {}),
          });
          rows = full.data;
        }
      }

      downloadCsv(
        'imoveis.csv',
        [
          'Nome',
          'Cidade',
          'Estado',
          'Tipo',
          'Status',
          'Finalidade',
          'Corretor',
          'Valor',
          'Dormitórios',
          'Área m²',
        ],
        rows.map((property) => [
          property.name,
          property.city,
          property.state,
          PROPERTY_TYPE_LABEL[property.type],
          PROPERTY_STATUS_LABEL[property.status],
          LISTING_TYPE_LABEL[property.listingType],
          getAgentDisplayName(property.agentId),
          property.cost,
          property.bedrooms,
          property.sizeSqm,
        ]),
      );
      toast.success('CSV exportado');
    } catch {
      toast.error('Não foi possível exportar os imóveis');
    }
  }

  const meta = result?.meta ?? {
    total: 0,
    page: 1,
    perPage,
    totalPages: 1,
  };
  const items = result?.data ?? [];
  const startIndex = (meta.page - 1) * meta.perPage + 1;

  const perPageOptions = useMemo(() => buildPerPageOptions(meta.total), [meta.total]);

  useEffect(() => {
    if (!perPageOptions.includes(perPage)) {
      setPerPage(perPageOptions[0] ?? DEFAULT_PER_PAGE);
      setPage(1);
    }
  }, [perPageOptions, perPage]);

  const pagination = (
    <ListifyPagination
      count={meta.total}
      page={meta.page}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      rowsPerPageOptions={perPageOptions}
    />
  );

  return (
    <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ minWidth: 0, width: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
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
          Imóveis ativos
        </Typography>

        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.5, md: 2.5 }}
          sx={{
            width: { xs: '100%', md: 'auto' },
            alignItems: 'center',
            flexWrap: 'nowrap',
            '& > .MuiButton-root': {
              flex: { xs: '1 1 0', md: '0 0 auto' },
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
            component={Link}
            href="/properties/new"
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: { xs: '14px', sm: '20px' },
              px: { xs: 2, sm: 3 },
              py: { xs: 1.25, sm: 1.75 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            Adicionar imóvel
          </Button>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          minHeight: { sm: 56 },
        }}
      >
        <SearchInput
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Buscar imóvel..."
          sx={{
            width: { xs: '100%', sm: 386 },
            maxWidth: '100%',
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
          spacing={1.5}
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
          }}
        >
          <FilterDrawer
            groups={PROPERTIES_FILTER_GROUPS}
            values={filters}
            onValuesChange={handleFiltersChange}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              aria-label="Visualização em lista"
              aria-pressed={viewMode === 'list'}
              onClick={() => handleViewChange('list')}
              sx={viewToggleIconSx(viewMode === 'list')}
            >
              <ViewListIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            <IconButton
              aria-label="Visualização em grade"
              aria-pressed={viewMode === 'grid'}
              onClick={() => handleViewChange('grid')}
              sx={viewToggleIconSx(viewMode === 'grid')}
            >
              <GridViewRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      <FilterPills
        groups={PROPERTIES_FILTER_GROUPS}
        values={filters}
        onValuesChange={handleFiltersChange}
      />

      {isLoading && items.length === 0 ? (
        <Box
          sx={{
            borderRadius: '20px',
            bgcolor: (theme) => listifyElevatedSurface(theme),
            px: 3,
            py: 10,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Carregando imóveis…
          </Typography>
        </Box>
      ) : items.length === 0 ? (
        <Box
          sx={{
            borderRadius: '20px',
            bgcolor: (theme) => listifyElevatedSurface(theme),
            px: 3,
            py: 10,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 500 }}>Nenhum imóvel encontrado</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
            Ajuste a busca ou os filtros, ou adicione um novo imóvel.
          </Typography>
        </Box>
      ) : viewMode === 'list' ? (
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <PropertiesTable properties={items} startIndex={startIndex} />
          {pagination}
        </Box>
      ) : (
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              columnGap: 1.5,
              rowGap: 2,
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {items.map((property) => (
              <Box component="li" key={property.id} sx={{ minWidth: 0 }}>
                <PropertyCard property={property} />
              </Box>
            ))}
          </Box>
          {pagination}
        </Box>
      )}
    </Stack>
  );
}
