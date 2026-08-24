"use client";

import { useState } from "react";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  Mail,
  Rocket,
  UserRound,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@citybox/ui/atoms";
import type {
  StoreDeploymentStatus,
  StoreTeamSource,
  StoreVerticalOwner,
  Vertical,
} from "../../types";
import { useVerticalOwnerQuery } from "../../hooks/use-vertical-owner-query";
import {
  useProvisionStoreMutation,
  useResetStoreOwnerCredentialsMutation,
} from "../../hooks/use-store-mutations";
import {
  StoreMemberCredentialsDialog,
  type ProvisionalCredentials,
} from "./store-member-credentials-dialog";
import {
  StoreProvisionConfirmDialog,
  type ProvisionConfirmPreview,
} from "./store-provision-confirm-dialog";

interface StoreOwnerCardProps {
  storeId: string;
  teamSource: StoreTeamSource;
  deploymentStatus?: StoreDeploymentStatus;
  vertical: Vertical;
  responsibleName: string | null;
  billingEmail: string | null;
}

function hasAnyCredential(owner: StoreVerticalOwner): boolean {
  return owner.hasPassword || owner.provisionalExpiresAt !== null;
}

function OwnerAccessBadge({ owner }: { owner: StoreVerticalOwner }) {
  if (owner.isDisabled) {
    return (
      <Badge variant="outline" className="text-xs font-normal">
        Acesso desativado
      </Badge>
    );
  }

  if (owner.hasPassword) {
    return (
      <Badge variant="secondary" className="text-xs font-normal">
        Senha definida
      </Badge>
    );
  }

  if (owner.provisionalExpiresAt !== null) {
    return (
      <Badge variant="secondary" className="text-xs font-normal">
        Senha provisória gerada
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-xs font-normal text-amber-700"
    >
      Sem senha definida
    </Badge>
  );
}

/** Prévia do username — a vertical pode ajustar (ex.: sufixo de colisão na clínica). */
export function previewUsername(
  vertical: Vertical,
  billingEmail: string | null,
): string {
  const email = billingEmail?.trim().toLowerCase() ?? "";
  if (!email) return "—";
  if (vertical === "Clínica") {
    const local = email.split("@")[0] ?? email;
    return local || email;
  }
  return email;
}

function buildConfirmPreview(
  responsibleName: string | null,
  billingEmail: string | null,
  vertical: Vertical,
): ProvisionConfirmPreview | null {
  const name = responsibleName?.trim() ?? "";
  const email = billingEmail?.trim().toLowerCase() ?? "";
  if (!name || !email) return null;
  return {
    responsibleName: name,
    email,
    username: previewUsername(vertical, email),
  };
}

/**
 * Responsável da loja — provisionamento sob demanda + gerar/resetar senha.
 *
 * Sempre visível no detalhe. Com `PENDING`/`FAILED` mostra **Provisionar**; com
 * `ACTIVE` e `teamSource=vertical` consulta o OWNER na vertical.
 */
export function StoreOwnerCard({
  storeId,
  teamSource,
  deploymentStatus = "PENDING",
  vertical,
  responsibleName,
  billingEmail,
}: StoreOwnerCardProps) {
  const needsProvision =
    deploymentStatus === "PENDING" || deploymentStatus === "FAILED";
  const isProvisioning = deploymentStatus === "PROVISIONING";
  const isActive = deploymentStatus === "ACTIVE";
  const isVerticalTeam = teamSource === "vertical";

  const { owner, isPending, error } = useVerticalOwnerQuery(storeId, {
    enabled: isActive && isVerticalTeam,
  });
  const credentialsMutation = useResetStoreOwnerCredentialsMutation(storeId);
  const provisionMutation = useProvisionStoreMutation(storeId);

  const [credentials, setCredentials] = useState<ProvisionalCredentials | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmPreview = buildConfirmPreview(
    responsibleName,
    billingEmail,
    vertical,
  );

  async function handleGenerateCredentials() {
    const result = await credentialsMutation.mutateAsync();
    setCredentials({
      username: result.username,
      password: result.provisionalPassword,
    });
  }

  async function handleConfirmProvision() {
    const result = await provisionMutation.mutateAsync();
    setConfirmOpen(false);
    setCredentials({
      username: result.username,
      password: result.provisionalPassword,
    });
  }

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="pb-1 pt-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Responsável pelo acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {needsProvision ? (
            <ProvisionPendingBody
              responsibleName={responsibleName}
              billingEmail={billingEmail}
              usernamePreview={previewUsername(vertical, billingEmail)}
              failed={deploymentStatus === "FAILED"}
              canProvision={Boolean(confirmPreview)}
              onProvision={() => setConfirmOpen(true)}
            />
          ) : isProvisioning ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Provisionando a vertical…
            </div>
          ) : !isVerticalTeam ? (
            <p className="text-sm text-muted-foreground">
              Configure a URL da vertical no admin-api (`ERP_API_URL` /
              `CLINICA_API_URL` / `IMOVEIS_API_URL` / `BEAUTIFUL_API_URL`) para
              gerenciar o responsável.
            </p>
          ) : isPending ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2.5 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">
                Não foi possível consultar o responsável na vertical. Verifique se o
                sistema do lojista está no ar e recarregue a página.
              </p>
            </div>
          ) : !owner ? (
            <p className="text-sm text-muted-foreground">
              Esta loja ainda não tem responsável cadastrado na vertical.
            </p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {[owner.firstName, owner.lastName].filter(Boolean).join(' ')}
                    </p>
                    <OwnerAccessBadge owner={owner} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">@{owner.username}</span>
                    {owner.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {owner.email}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={credentialsMutation.isPending}
                onClick={() => void handleGenerateCredentials()}
              >
                <KeyRound className="mr-1.5 h-4 w-4" />
                {hasAnyCredential(owner) ? "Gerar nova senha" : "Gerar senha"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <StoreProvisionConfirmDialog
        open={confirmOpen}
        preview={confirmPreview}
        isPending={provisionMutation.isPending}
        onConfirm={() => void handleConfirmProvision()}
        onCancel={() => setConfirmOpen(false)}
      />

      <StoreMemberCredentialsDialog
        credentials={credentials}
        onOpenChange={() => setCredentials(null)}
      />
    </>
  );
}

function ProvisionPendingBody({
  responsibleName,
  billingEmail,
  usernamePreview,
  failed,
  canProvision,
  onProvision,
}: {
  responsibleName: string | null;
  billingEmail: string | null;
  usernamePreview: string;
  failed: boolean;
  canProvision: boolean;
  onProvision: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        {failed ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Falha no provisionamento anterior. Tente novamente.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            A loja ainda não foi provisionada na vertical. Confirme os dados e
            provisionar para gerar o login.
          </p>
        )}
        <div className="space-y-1 text-sm">
          <p className="font-medium">{responsibleName?.trim() || "—"}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {billingEmail?.trim() || "—"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            username: {usernamePreview}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="shrink-0"
        disabled={!canProvision}
        onClick={onProvision}
      >
        <Rocket className="mr-1.5 h-4 w-4" />
        {failed ? "Tentar novamente" : "Provisionar"}
      </Button>
    </div>
  );
}
