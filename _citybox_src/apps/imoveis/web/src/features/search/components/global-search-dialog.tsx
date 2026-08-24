'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import {
  CommandPalette,
  type CommandPaletteGroup,
} from '@citybox/mui/organisms';
import { useGlobalSearchDialog } from '../hooks/use-global-search';
import type { GlobalSearchHitType } from '../types';

const TYPE_ICON: Record<GlobalSearchHitType, ReactNode> = {
  lead: <PeopleOutlinedIcon sx={{ fontSize: 20 }} />,
  property: <HomeWorkOutlinedIcon sx={{ fontSize: 20 }} />,
  transaction: <HandshakeOutlinedIcon sx={{ fontSize: 20 }} />,
  appointment: <EventOutlinedIcon sx={{ fontSize: 20 }} />,
  nav: <MenuOutlinedIcon sx={{ fontSize: 20 }} />,
};

type GlobalSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  result: ReturnType<typeof useGlobalSearchDialog>['result'];
  isLoading: boolean;
};

export function GlobalSearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  result,
  isLoading,
}: GlobalSearchDialogProps) {
  const router = useRouter();

  const groups: CommandPaletteGroup[] = useMemo(
    () =>
      result.groups.map((group) => ({
        heading: group.heading,
        items: group.hits.map((hit) => ({
          id: hit.id,
          label: hit.title,
          description: hit.subtitle,
          keywords: hit.keywords,
          icon: TYPE_ICON[hit.type],
          onSelect: () => {
            router.push(hit.href);
          },
        })),
      })),
    [result.groups, router],
  );

  const emptyMessage =
    query.trim().length === 0
      ? 'Digite para buscar leads, imóveis, negócios, agenda e páginas.'
      : isLoading
        ? 'Buscando…'
        : 'Nenhum resultado encontrado.';

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      title="Busca"
      placeholder="Buscar em todo o sistema…"
      emptyMessage={emptyMessage}
      query={query}
      onQueryChange={onQueryChange}
      filterMode="external"
      loading={isLoading}
      shortcutKey="k"
    />
  );
}
