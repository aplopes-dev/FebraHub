"use client";

import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { EmptyState } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import { useStoreDetailQuery } from "../../hooks/use-store-detail-query";
import { StoreDetailPage } from "./store-detail-page";
import { StoreDetailSkeleton } from "./store-detail-skeleton";

function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && /→\s*404:/.test(err.message);
}

interface StoreDetailRouteProps {
  id: string;
}

export function StoreDetailRoute({ id }: StoreDetailRouteProps) {
  const { detail, isPending, error, refetch } = useStoreDetailQuery(id);

  if (isPending) {
    return <StoreDetailSkeleton />;
  }

  if (error && isNotFoundError(error)) {
    notFound();
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="size-10" />}
        title="Não foi possível carregar a loja"
        description={extractApiMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  if (!detail) {
    notFound();
    return null;
  }

  return <StoreDetailPage detail={detail} />;
}
