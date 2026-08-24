'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@citybox/ui/atoms';
import { useSignatureCreditsQuery } from '../hooks/use-signature-packages-queries';

/** Card com o saldo de assinatura eletrônica (API). */
export function AssinaturaSaldoCard() {
  const { data, isLoading, isError, error } = useSignatureCreditsQuery();

  return (
    <Card className="flex h-full flex-col gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-4">
        <CardTitle className="text-center text-lg font-semibold">
          Saldo de Assinatura Eletrônica
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center px-5 pb-5">
        {isLoading ? (
          <Skeleton
            className="h-12 w-16"
            data-testid="assinatura-saldo-skeleton"
          />
        ) : isError ? (
          <p
            className="text-center text-sm text-destructive"
            data-testid="assinatura-saldo-error"
          >
            {error instanceof Error
              ? error.message
              : 'Não foi possível carregar o saldo.'}
          </p>
        ) : (
          <p
            className="text-5xl font-bold tabular-nums tracking-tight text-foreground"
            data-testid="assinatura-saldo"
          >
            {data?.balance ?? '—'}
          </p>
        )}
        {!isError ? (
          <p className="mt-2 text-sm text-muted-foreground">assinaturas</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
