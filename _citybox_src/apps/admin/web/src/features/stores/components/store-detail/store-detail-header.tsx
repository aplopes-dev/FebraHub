"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Store,
  Unlock,
  Wrench,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { VerticalBadge } from "@citybox/ui/molecules";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
import type { LojaDetail } from "../../types";
import {
  lojaStatusConfig,
  connectionStatusConfig,
  deploymentStatusConfig,
  resolveBlockedStatusLabel,
} from "../../lib/store-status-config";
import {
  useBlockStoreMutation,
  useUnblockStoreMutation,
  useUpdateStoreSettingsMutation,
} from "../../hooks/use-store-mutations";

interface StoreDetailHeaderProps {
  detail: LojaDetail;
  onEdit?: () => void;
  onImpersonate?: () => void;
}

export function StoreDetailHeader({
  detail,
  onEdit,
  onImpersonate,
}: StoreDetailHeaderProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(detail.settings.maintenanceMode);

  const blockMutation = useBlockStoreMutation();
  const unblockMutation = useUnblockStoreMutation();
  const settingsMutation = useUpdateStoreSettingsMutation(detail.id);

  const isBlocked = detail.status === "BLOCKED";
  const isActionsPending =
    blockMutation.isPending || unblockMutation.isPending || settingsMutation.isPending;

  const { label: defaultStatusLabel, className: statusClassName } = lojaStatusConfig[detail.status];
  const statusLabel = isBlocked
    ? resolveBlockedStatusLabel(detail.auditLog)
    : defaultStatusLabel;
  const { label: connectionLabel, dotClass } = connectionStatusConfig[detail.connectionStatus];

  useEffect(() => {
    setMaintenanceMode(detail.settings.maintenanceMode);
  }, [detail.settings.maintenanceMode]);

  async function handleConfirmBlock() {
    await blockMutation.mutateAsync(detail.id);
    setBlockDialogOpen(false);
  }

  async function handleUnblock() {
    await unblockMutation.mutateAsync(detail.id);
  }

  async function handleMaintenanceChange(checked: boolean) {
    const previous = maintenanceMode;
    setMaintenanceMode(checked);
    try {
      const settings = detail.settings;
      await settingsMutation.mutateAsync({
        maintenanceMode: checked,
        visibleInApp: settings.visibleInApp,
        status: settings.status,
        trialEndsAt: settings.trialEndsAt,
        sefazHomologacao: settings.sefazHomologacao,
        contingenciaOffline: settings.contingenciaOffline,
      });
    } catch {
      setMaintenanceMode(previous);
    }
  }

  return (
    <>
      <header
        className={cn(
          "bg-card",
          isBlocked && "border-b-2 border-destructive/40 bg-destructive/3",
        )}
      >
        <div className="px-6 py-6">
          {isBlocked && (
            <Alert variant="destructive" className="mb-5">
              <Ban />
              <AlertTitle>Loja bloqueada</AlertTitle>
              <AlertDescription>
                Esta loja está bloqueada e não pode operar no sistema. Use o menu de ações para
                desbloquear ou entre em contato com o suporte.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted",
                  isBlocked && "opacity-60 grayscale",
                )}
              >
                <Store className="h-7 w-7 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1
                      className={cn(
                        "text-2xl font-bold tracking-tight leading-none",
                        isBlocked && "text-muted-foreground",
                      )}
                    >
                      {detail.tradeName}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-xs font-medium", statusClassName)}
                    >
                      {isBlocked && <Ban className="mr-1 h-3 w-3" />}
                      {statusLabel}
                    </Badge>
                    {detail.deploymentStatus ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          deploymentStatusConfig[detail.deploymentStatus].className,
                        )}
                      >
                        {deploymentStatusConfig[detail.deploymentStatus].label}
                      </Badge>
                    ) : null}
                    {maintenanceMode && !isBlocked ? (
                      <Badge variant="outline" className="shrink-0 text-xs font-medium">
                        Manutenção
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Responsável:{" "}
                    <span className="font-medium text-foreground">{detail.clientName}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <VerticalBadge vertical={detail.vertical} />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", dotClass)} />
                    {connectionLabel}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    /{detail.slug}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button onClick={onImpersonate} disabled={isBlocked}>
                <ExternalLink className="h-4 w-4" />
                Acessar como Lojista
              </Button>
              <Button variant="secondary" onClick={onEdit} disabled={isBlocked}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={isActionsPending}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Mais ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuCheckboxItem
                    checked={maintenanceMode}
                    disabled={settingsMutation.isPending}
                    onCheckedChange={(checked) => void handleMaintenanceChange(checked)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Modo manutenção
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {isBlocked ? (
                    <DropdownMenuItem
                      disabled={unblockMutation.isPending}
                      onClick={() => void handleUnblock()}
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Desbloquear loja
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setBlockDialogOpen(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Bloquear loja
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        title="Bloquear loja?"
        description={
          <>
            A loja <strong>{detail.tradeName}</strong> será bloqueada e deixará de operar no
            sistema. Esta ação pode ser revertida posteriormente.
          </>
        }
        confirmLabel="Bloquear"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={blockMutation.isPending}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
}
