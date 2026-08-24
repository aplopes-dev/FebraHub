'use client';

import Search from '@mui/icons-material/Search';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { Button, CommandPalette } from '@citybox/mui';
import {
  allBeautifulModules,
  BEAUTIFUL_CATALOG_TABS,
} from '@/lib/navigation';
import {
  canAccessCatalogTab,
  listAllowedSettingsTabs,
  resolveBeautifulModulePath,
} from '@/lib/beautiful-nav-permissions';
import { useStore } from '@/lib/store-context';
import { listClients } from '@/features/clients/services/client-service';
import { listServices } from '@/features/catalog/services/catalog-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type SearchHit = {
  id: string;
  label: string;
  path: string;
  group: 'navegacao' | 'clientes' | 'catalogo';
  description?: string;
};

function buildNavigationHits(
  permissions: string[],
  isOrganizationOwner: boolean,
): SearchHit[] {
  const modules = allBeautifulModules().map((mod) => ({
    id: `nav-${mod.id}`,
    label: mod.label,
    path: resolveBeautifulModulePath(
      mod.id,
      mod.path,
      permissions,
      isOrganizationOwner,
    ),
    group: 'navegacao' as const,
    description: mod.description,
  }));

  const settings = listAllowedSettingsTabs(
    permissions,
    isOrganizationOwner,
  ).map((tab) => ({
    id: `settings-${tab.id}`,
    label: tab.label,
    path: tab.path,
    group: 'navegacao' as const,
    description: 'Configurações',
  }));

  const catalog = BEAUTIFUL_CATALOG_TABS.filter((tab) =>
    canAccessCatalogTab(tab.id, permissions, isOrganizationOwner),
  ).map((tab) => ({
    id: `catalog-${tab.id}`,
    label: tab.label,
    path: tab.path,
    group: 'navegacao' as const,
    description: 'Catálogo',
  }));

  return [...modules, ...settings, ...catalog];
}

export function CommandSearch() {
  const router = useRouter();
  const { storeId, stores } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const permissions = active?.permissions ?? [];
  const isOwner = active?.isOrganizationOwner === true;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [clientHits, setClientHits] = useState<SearchHit[]>([]);
  const [catalogHits, setCatalogHits] = useState<SearchHit[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const navHits = useMemo(
    () => buildNavigationHits(permissions, isOwner),
    [isOwner, permissions],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setClientHits([]);
      setCatalogHits([]);
      return;
    }

    const search = debouncedQuery.trim();
    if (search.length < 2) {
      setClientHits([]);
      setCatalogHits([]);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);

    void Promise.all([
      listClients({ search, perPage: 100 }),
      listServices({ search, active: true, perPage: 100 }),
    ])
      .then(([clientsPage, servicesPage]) => {
        if (cancelled) return;
        setClientHits(
          clientsPage.data.slice(0, 8).map((client) => ({
            id: `cli-${client.id}`,
            label: client.name,
            path: '/clientes',
            group: 'clientes' as const,
            description: client.phone,
          })),
        );
        setCatalogHits(
          servicesPage.data.slice(0, 8).map((service) => ({
            id: `svc-${service.id}`,
            label: service.name,
            path: '/catalogo',
            group: 'catalogo' as const,
            description: `${service.durationMinutes} min`,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setClientHits([]);
        setCatalogHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRemote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  const filteredNav = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return navHits;
    return navHits.filter(
      (hit) =>
        hit.label.toLowerCase().includes(q) ||
        hit.description?.toLowerCase().includes(q),
    );
  }, [navHits, debouncedQuery]);

  const runHit = (hit: SearchHit) => {
    setOpen(false);
    router.push(hit.path);
  };

  const groups = useMemo(() => {
    const result = [
      {
        heading: 'Navegação',
        items: filteredNav.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          onSelect: () => runHit(hit),
        })),
      },
    ];

    if (clientHits.length > 0) {
      result.push({
        heading: 'Clientes',
        items: clientHits.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          onSelect: () => runHit(hit),
        })),
      });
    }

    if (catalogHits.length > 0) {
      result.push({
        heading: 'Catálogo',
        items: catalogHits.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          onSelect: () => runHit(hit),
        })),
      });
    }

    return result;
  }, [filteredNav, clientHits, catalogHits]);

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        onClick={() => setOpen(true)}
        aria-label="Buscar páginas, clientes ou catálogo"
        sx={{
          height: 36,
          width: { xs: '100%', sm: 320 },
          maxWidth: 320,
          justifyContent: 'flex-start',
          gap: 1,
          px: 1.5,
          color: 'text.secondary',
        }}
      >
        <Search sx={{ fontSize: 16 }} aria-hidden />
        <Box
          component="span"
          sx={{
            flex: 1,
            textAlign: 'left',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Buscar página, cliente…
        </Box>
        <Box
          component="kbd"
          sx={(theme) => ({
            display: { xs: 'none', sm: 'inline-flex' },
            alignItems: 'center',
            height: 20,
            px: 0.75,
            borderRadius: theme.shape.borderRadius,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
            fontFamily: 'monospace',
            fontSize: '10px',
            fontWeight: 500,
            color: 'text.secondary',
          })}
        >
          ⌘K
        </Box>
      </Button>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        query={query}
        onQueryChange={setQuery}
        loading={loadingRemote}
        title="Busca"
        description="Navegue por páginas ou busque clientes e serviços"
        placeholder="Digite para buscar…"
      />
    </>
  );
}
