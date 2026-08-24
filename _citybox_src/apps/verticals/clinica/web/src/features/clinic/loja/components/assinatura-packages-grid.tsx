'use client';

import { useMemo } from 'react';
import { Button, Card, CardContent, Skeleton } from '@citybox/ui/atoms';
import {
  ASSINATURA_PACKAGES,
  type AssinaturaPackage,
} from '../data/assinatura-packages';
import {
  useCreateSignaturePackageRequestMutation,
  useSignaturePackageRequestsQuery,
} from '../hooks/use-signature-packages-queries';
import { formatAssinaturaPrice } from '../lib/format-assinatura-price';
import { AssinaturaSolicitacoesCard } from './assinatura-solicitacoes-card';

const PACKAGE_CARD_BG = 'bg-[#0B3A6E]';

/** Grid com os 3 mini-cards de pacotes + card cinza de solicitações. */
export function AssinaturaPackagesGrid() {
  const { data: pendingPage, isLoading: pendingLoading } =
    useSignaturePackageRequestsQuery({
      status: 'pending',
      page: 1,
      perPage: 10,
    });
  const { data: totalPage, isLoading: totalLoading } =
    useSignaturePackageRequestsQuery({
      page: 1,
      perPage: 1,
    });
  const { mutate, isPending, variables } =
    useCreateSignaturePackageRequestMutation();

  const isLoading = pendingLoading || totalLoading;
  const totalCount = totalPage?.meta.total ?? 0;

  const pendingPackageIds = useMemo(() => {
    const ids = new Set<string>();
    for (const request of pendingPage?.items ?? []) {
      if (request.status === 'pending') {
        ids.add(request.packageId);
      }
    }
    return ids;
  }, [pendingPage?.items]);

  function handleSolicitar(pkg: AssinaturaPackage) {
    mutate(pkg.id);
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {ASSINATURA_PACKAGES.map((pkg) => {
        const isRequested = pendingPackageIds.has(pkg.id);
        const isCreatingThis = isPending && variables === pkg.id;
        const disabled = isLoading || isPending || isRequested;

        return (
          <Card
            key={pkg.id}
            className={`w-full max-w-[10.5rem] shrink-0 border-transparent py-0 text-white ${PACKAGE_CARD_BG}`}
          >
            <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
              <div>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  {pkg.quantity}
                </p>
                <p className="text-sm text-white/80">assinaturas</p>
              </div>
              <p className="text-xl font-semibold tabular-nums">
                R$ {formatAssinaturaPrice(pkg.priceReais)}
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-full bg-white/20" />
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full bg-white text-[#0B3A6E] hover:bg-white/90 disabled:bg-white/70 disabled:text-[#0B3A6E]/disabled:opacity-100"
                  disabled={disabled}
                  onClick={() => handleSolicitar(pkg)}
                >
                  {isCreatingThis
                    ? 'Solicitando…'
                    : isRequested
                      ? 'Solicitado'
                      : 'Solicitar'}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AssinaturaSolicitacoesCard
        totalCount={totalCount}
        isLoading={totalLoading}
      />
    </div>
  );
}
