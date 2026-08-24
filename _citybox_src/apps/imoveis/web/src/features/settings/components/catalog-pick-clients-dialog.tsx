'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
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
import { SCROLL_CLASS } from '@/lib/scroll';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { LeadStatusBadge } from '@/features/leads/components/lead-status-badge';
import {
  useLeadsQuery,
  useSyncAgentCatalogMutation,
} from '@/features/leads/hooks/use-leads-queries';
import type { ContactLeadDetail } from '@/features/leads/types';
import { SETTINGS_MODAL_SEARCH_SX } from '../utils/settings-form-styles';

type CatalogPickClientsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
};

export function CatalogPickClientsDialog({
  open,
  onOpenChange,
  agentId,
}: CatalogPickClientsDialogProps) {
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
        <CatalogPickClientsDialogContent
          agentId={agentId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Modal>
  );
}

function CatalogPickClientsDialogContent({
  agentId,
  onOpenChange,
}: {
  agentId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: result, isLoading } = useLeadsQuery({
    page: 1,
    perPage: 200,
    status: ['closed-won'],
  });
  const syncMutation = useSyncAgentCatalogMutation();
  const allLeads = result?.data ?? [];

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || isLoading || !result) return;
    setSelectedIds(
      new Set(
        allLeads.filter((item) => item.agentId === agentId).map((item) => item.id),
      ),
    );
    setInitialized(true);
  }, [agentId, allLeads, initialized, isLoading, result]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLeads;
    return allLeads.filter((item) => {
      const haystack = `${item.name} ${item.email ?? ''} ${item.intent}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allLeads, search]);

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
      toast.success('Catálogo de clientes atualizado');
      onOpenChange(false);
    } catch (err) {
      toast.error('Não foi possível atualizar o catálogo', {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <>
      <ModalTitle>Adicionar clientes ao catálogo</ModalTitle>
      <ModalContent className="flex min-h-0 flex-1 flex-col gap-4">
        <ModalDescription>
          Selecione clientes com venda concluída (status Fechado) para exibir no seu
          perfil público. Os demais continuam na listagem geral com o corretor
          responsável.
        </ModalDescription>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente"
          fullWidth
          sx={SETTINGS_MODAL_SEARCH_SX}
        />

        <ul className={`${SCROLL_CLASS} min-h-0 flex-1 space-y-2 overflow-y-auto pr-1`}>
          {isLoading ? (
            <li className="rounded-2xl bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Carregando clientes…
            </li>
          ) : (
            <>
              {filtered.map((lead) => (
                <ClientPickRow
                  key={lead.id}
                  lead={lead}
                  checked={selectedIds.has(lead.id)}
                  onToggle={() => toggle(lead.id)}
                />
              ))}
              {filtered.length === 0 ? (
                <li className="rounded-2xl bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </li>
              ) : null}
            </>
          )}
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
            onClick={() => void handleSave()}
            disabled={syncMutation.isPending || isLoading}
          >
            Salvar no catálogo
          </ModalConfirmButton>
        </div>
      </ModalActions>
    </>
  );
}

function ClientPickRow({
  lead,
  checked,
  onToggle,
}: {
  lead: ContactLeadDetail;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-secondary/50">
        <Checkbox checked={checked} onChange={onToggle} />
        <Avatar
          src={lead.photoUrl}
          alt={lead.photoUrl ? '' : undefined}
          className="size-11 shrink-0"
          sx={{ width: 44, height: 44 }}
        >
          {lead.initials}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.intent}</p>
        </div>
        <LeadStatusBadge status={lead.status} className="max-w-[7rem] truncate" />
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
          {getAgentShortName(lead.agentId)}
        </span>
      </label>
    </li>
  );
}
