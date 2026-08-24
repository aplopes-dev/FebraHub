'use client';

import { useMemo, useState } from 'react';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { PropertyCard } from '@/features/properties/components/property-card';
import { usePropertiesQuery } from '@/features/properties/hooks/use-properties-queries';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';

type SettingsProfilePropertiesTabProps = {
  agentId: string;
};

/** Portfólio de vendas concluídas — imóveis esgotados (`sold-out`) do corretor. */
export function SettingsProfilePropertiesTab({
  agentId,
}: SettingsProfilePropertiesTabProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const { data: result, isLoading } = usePropertiesQuery({
    agentId,
    status: ['sold-out'],
    page,
    perPage,
  });

  const items = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const perPageOptions = useMemo(() => buildPerPageOptions(total), [total]);

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Imóveis vendidos</h3>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Carregando imóveis…'
            : total === 0
              ? 'Nenhuma venda concluída vinculada a você ainda.'
              : total === 1
                ? '1 imóvel vendido aparece aqui automaticamente.'
                : `${total} imóveis vendidos aparecem aqui automaticamente.`}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Quando um negócio for concluído e o imóvel ficar com status Esgotado, ele
          entra nesta lista — sem precisar adicionar manualmente.
        </div>
      ) : (
        <>
          <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((property) => (
              <li key={property.id} className="min-w-0 max-w-full overflow-hidden">
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
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
        </>
      )}
    </div>
  );
}
