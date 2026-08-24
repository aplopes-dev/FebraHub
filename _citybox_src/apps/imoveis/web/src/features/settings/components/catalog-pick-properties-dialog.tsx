'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Checkbox,
  Input,
} from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { toast } from '@citybox/mui/molecules';
import { PropertyImage } from '@/components/ui/property-image';
import { SCROLL_CLASS } from '@/lib/scroll';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatCostDisplay } from '@/features/properties/utils/field-masks';
import {
  usePropertiesQuery,
  useSyncAgentCatalogPropertiesMutation,
} from '@/features/properties/hooks/use-properties-queries';
import type { PropertyListing } from '@/features/properties/types';
import { SETTINGS_MODAL_SEARCH_SX } from '../utils/settings-form-styles';

type CatalogPickPropertiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
};

export function CatalogPickPropertiesDialog({
  open,
  onOpenChange,
  agentId,
}: CatalogPickPropertiesDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      {open ? (
        <CatalogPickPropertiesDialogContent
          agentId={agentId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Modal>
  );
}

function CatalogPickPropertiesDialogContent({
  agentId,
  onOpenChange,
}: {
  agentId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: allResult, isLoading } = usePropertiesQuery(
    { page: 1, perPage: 200 },
    true,
  );
  const syncMutation = useSyncAgentCatalogPropertiesMutation();
  const allProperties = allResult?.data ?? [];

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(
      new Set(
        allProperties
          .filter((item) => item.agentId === agentId)
          .map((item) => item.id),
      ),
    );
  }, [allProperties, agentId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProperties;
    return allProperties.filter((item) => {
      const haystack = `${item.name} ${item.city} ${item.state}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allProperties, search]);

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    try {
      await syncMutation.mutateAsync({
        agentId,
        selectedIds: [...selectedIds],
      });
      toast.success('Catálogo de imóveis atualizado');
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível atualizar o catálogo.');
    }
  }

  return (
    <>
      <ModalTitle>Adicionar imóveis ao catálogo</ModalTitle>
      <ModalContent className="flex min-h-0 flex-1 flex-col gap-4">
        <ModalDescription>
          Selecione os imóveis que deseja vincular ao seu perfil. Os demais
          continuam na listagem geral com o corretor responsável.
        </ModalDescription>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar imóvel..."
          aria-label="Buscar imóvel"
          fullWidth
          sx={SETTINGS_MODAL_SEARCH_SX}
        />

        <ul className={`${SCROLL_CLASS} min-h-0 flex-1 space-y-2 overflow-y-auto pr-1`}>
          {isLoading ? (
            <li className="rounded-2xl bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Carregando imóveis…
            </li>
          ) : null}
          {filtered.map((property) => (
            <PropertyPickRow
              key={property.id}
              property={property}
              checked={selectedIds.has(property.id)}
              onToggle={() => toggle(property.id)}
            />
          ))}
          {!isLoading && filtered.length === 0 ? (
            <li className="rounded-2xl bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum imóvel encontrado.
            </li>
          ) : null}
        </ul>
      </ModalContent>

      <ModalActions className="gap-2 sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}
        </p>
        <div className="flex flex-1 gap-2 min-w-0">
          <ModalCancelButton type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </ModalCancelButton>
          <ModalConfirmButton
            type="button"
            onClick={handleSave}
            disabled={syncMutation.isPending}
          >
            Salvar no catálogo
          </ModalConfirmButton>
        </div>
      </ModalActions>
    </>
  );
}

function PropertyPickRow({
  property,
  checked,
  onToggle,
}: {
  property: PropertyListing;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-secondary/50">
        <Checkbox checked={checked} onChange={onToggle} />
        <div className="size-11 shrink-0 overflow-hidden rounded-xl">
          {property.photoUrls[0] ? (
            <AuthPropertyPhoto
              src={property.photoUrls[0]}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <PropertyImage seed={property.id} alt="" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{property.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {property.city}, {property.state} · {PROPERTY_TYPE_LABEL[property.type]} ·{' '}
            {formatCostDisplay(property.cost)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
          {getAgentShortName(property.agentId)}
        </span>
      </label>
    </li>
  );
}
