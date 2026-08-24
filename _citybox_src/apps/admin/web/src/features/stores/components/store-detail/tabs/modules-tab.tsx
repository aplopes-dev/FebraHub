"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Link2, Link2Off, Plug, PlugZap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Switch,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { StoreIntegration, StoreModule } from "../../../types";
import { useUpdateStoreModuleMutation } from "../../../hooks/use-store-mutations";

interface ModulesTabProps {
  storeId: string;
  modules: StoreModule[];
  integrations: StoreIntegration[];
}

// ─── ControlRow (mesmo padrão de settings-tab) ────────────────────────────────

function ControlRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Config de status de integração ──────────────────────────────────────────

const integrationStatusConfig: Record<
  StoreIntegration["status"],
  { label: string; className: string; icon: typeof Link2 }
> = {
  connected: {
    label: "Conectada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: PlugZap,
  },
  disconnected: {
    label: "Desconectada",
    className: "border-muted bg-muted/50 text-muted-foreground",
    icon: Link2Off,
  },
  error: {
    label: "Erro de Conexão",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: Link2,
  },
};

// ─── ModulesTab ───────────────────────────────────────────────────────────────

export function ModulesTab({ storeId, modules, integrations }: ModulesTabProps) {
  const moduleMutation = useUpdateStoreModuleMutation(storeId);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(modules.map((m) => [m.id, m.enabled])),
  );

  useEffect(() => {
    setModuleStates(Object.fromEntries(modules.map((m) => [m.id, m.enabled])));
  }, [modules]);

  async function handleToggle(moduleId: string, enabled: boolean) {
    setModuleStates((prev) => ({ ...prev, [moduleId]: enabled }));
    try {
      await moduleMutation.mutateAsync({ moduleKey: moduleId, enabled });
    } catch {
      setModuleStates((prev) => ({ ...prev, [moduleId]: !enabled }));
    }
  }

  const activeCount = Object.values(moduleStates).filter(Boolean).length;
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="rounded-[10px] bg-muted p-2">
      <Accordion
        type="single"
        collapsible
        defaultValue="modulos"
        className="rounded-[10px] border bg-background"
      >
        {/* ── Módulos ───────────────────────────────────────────────── */}
        <AccordionItem value="modulos">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div className="flex flex-1 items-center justify-between gap-4 mr-3">
              <div>
                <p className="text-sm font-medium text-left">Módulos Internos</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                  Funcionalidades opcionais que podem ser ativadas por loja
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium shrink-0",
                  activeCount > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-muted bg-muted/50 text-muted-foreground",
                )}
              >
                {activeCount} de {modules.length} {activeCount === 1 ? "ativo" : "ativos"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t">
              {modules.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Nenhum módulo disponível para esta vertical.
                </p>
              ) : (
                modules.map((mod) => (
                  <ControlRow
                    key={mod.id}
                    title={mod.label}
                    description={mod.description ?? "Módulo da plataforma Citybox."}
                  >
                    <Switch
                      checked={moduleStates[mod.id] ?? false}
                      disabled={moduleMutation.isPending}
                      onCheckedChange={(checked) => void handleToggle(mod.id, checked)}
                    />
                  </ControlRow>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Integrações ───────────────────────────────────────────── */}
        <AccordionItem value="integracoes">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div className="flex flex-1 items-center justify-between gap-4 mr-3">
              <div>
                <p className="text-sm font-medium text-left">Integrações Externas</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                  Marketplaces e serviços de terceiros conectados a esta loja
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium shrink-0",
                  connectedCount > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-muted bg-muted/50 text-muted-foreground",
                )}
              >
                {connectedCount} {connectedCount === 1 ? "conectada" : "conectadas"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t">
              {integrations.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Nenhuma integração configurada para esta loja.
                </p>
              ) : (
                integrations.map((integration) => {
                  const config = integrationStatusConfig[integration.status];
                  const Icon = config.icon;
                  return (
                    <ControlRow
                      key={integration.id}
                      title={integration.label}
                      description={
                        integration.status === "connected"
                          ? "Integração ativa e recebendo dados normalmente."
                          : integration.status === "error"
                            ? "Falha na conexão. Verifique as credenciais da integração."
                            : "Integração desconectada. Configure as credenciais para ativar."
                      }
                    >
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium gap-1.5", config.className)}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </ControlRow>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
