'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@citybox/mui/atoms';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { LeadCard } from '@/features/leads/components/lead-card';
import { useLeadsQuery } from '@/features/leads/hooks/use-leads-queries';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import { CatalogPickClientsDialog } from './catalog-pick-clients-dialog';

type SettingsProfileClientsTabProps = {
  agentId: string;
};

export function SettingsProfileClientsTab({ agentId }: SettingsProfileClientsTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const { data: result, isLoading } = useLeadsQuery({
    agentId,
    page,
    perPage,
    status: ['closed-won'],
  });

  const total = result?.meta.total ?? 0;
  const leads = result?.data ?? [];
  const perPageOptions = buildPerPageOptions(total);

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Meus clientes</h3>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Carregando clientes…'
              : total === 0
                ? 'Nenhum cliente com venda concluída vinculado a este corretor.'
                : total === 1
                  ? '1 cliente com venda concluída.'
                  : `${total} clientes com vendas concluídas.`}
          </p>
        </div>
        <Button
          type="button"
          variant="outlined"
          size="small"
          className="rounded-full"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => setPickerOpen(true)}
        >
          Ver todos os clientes
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum cliente com venda concluída no seu perfil. Use “Ver todos os clientes”
          para adicionar leads fechados ao catálogo.
        </div>
      ) : (
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {leads.map((lead) => (
            <li key={lead.id} className="min-w-0 max-w-full overflow-hidden">
              <LeadCard lead={lead} />
            </li>
          ))}
        </ul>
      )}

      {leads.length > 0 ? (
        <ListifyPagination
          count={total}
          page={result?.meta.page ?? page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(next) => {
            setPerPage(next);
            setPage(1);
          }}
          rowsPerPageOptions={perPageOptions}
        />
      ) : null}

      <CatalogPickClientsDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        agentId={agentId}
      />
    </div>
  );
}
