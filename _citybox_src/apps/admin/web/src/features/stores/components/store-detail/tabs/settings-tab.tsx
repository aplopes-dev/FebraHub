"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  Wifi,
  WifiOff,
  WrenchIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
import type { StoreStatus, LojaDetail } from "../../../types";
import { lojaStatusConfig } from "../../../lib/store-status-config";
import { useUpdateStoreSettingsMutation } from "../../../hooks/use-store-mutations";

interface SettingsTabProps {
  detail: LojaDetail;
}

// ─── ControlRow ───────────────────────────────────────────────────────────────

function ControlRow({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 py-4",
        danger && "rounded-lg bg-destructive/4 px-3 -mx-3",
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("text-sm font-medium", danger && "text-destructive")}>{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Painel contextual lateral ────────────────────────────────────────────────

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function ContextRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="shrink-0 text-xs font-medium">{value}</div>
    </div>
  );
}

function ContextPanel({
  detail,
  maintenance,
}: {
  detail: LojaDetail;
  maintenance: boolean;
}) {
  const { metrics, recentErrors, connectionStatus } = detail;
  const hasAlerts = recentErrors.length > 0;

  return (
    <div className="rounded-[10px] bg-muted p-2 self-start sticky top-4">
      <div className="rounded-[10px] border bg-background overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-4 py-3 border-b">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estado Atual da Loja
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Contexto para apoiar as alterações abaixo.
          </p>
        </div>

        {/* Status principal */}
        <div className="px-4 divide-y">
          <ContextRow
            icon={connectionStatus === "online" ? Wifi : WifiOff}
            label="PDV"
            value={
              connectionStatus === "online" ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  Offline
                </span>
              )
            }
          />
          <ContextRow
            icon={ShoppingBag}
            label="Pedidos hoje"
            value={
              metrics.ordersToday > 0 ? (
                <span className="text-foreground">{metrics.ordersToday}</span>
              ) : (
                <span className="text-muted-foreground">Nenhum</span>
              )
            }
          />
          <ContextRow
            icon={ShoppingBag}
            label="Último pedido"
            value={formatRelativeTime(metrics.lastOrderAt)}
          />
          <ContextRow
            icon={Clock}
            label="Último acesso"
            value={formatRelativeTime(metrics.lastAccessAt)}
          />
        </div>

        {/* Avisos ativos */}
        {(maintenance || hasAlerts) && (
          <>
            <Separator />
            <div className="px-4 py-3 space-y-2">
              {maintenance && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                  <WrenchIcon className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Loja em manutenção. Consumidores não conseguem fazer pedidos.
                  </p>
                </div>
              )}
              {recentErrors.map((err) => (
                <div
                  key={err.id}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-3 py-2",
                    err.severity === "error"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-amber-500/5 border-amber-200",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      err.severity === "error" ? "text-destructive" : "text-amber-600",
                    )}
                  />
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      err.severity === "error" ? "text-destructive" : "text-amber-700",
                    )}
                  >
                    {err.message}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Rodapé neutro quando tudo ok */}
        {!maintenance && !hasAlerts && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Nenhum alerta ativo no momento.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SettingsTab({ detail }: SettingsTabProps) {
  const s = detail.settings;
  const settingsMutation = useUpdateStoreSettingsMutation(detail.id);

  const [maintenance, setMaintenance] = useState(s.maintenanceMode);
  const [visibleInApp, setVisibleInApp] = useState(s.visibleInApp);
  const [status, setStatus] = useState<StoreStatus>(s.status);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | undefined>(
    s.trialEndsAt ? new Date(s.trialEndsAt) : undefined,
  );
  const [sefazHomo, setSefazHomo] = useState(s.sefazHomologacao);
  const [contingencia, setContingencia] = useState(s.contingenciaOffline);

  useEffect(() => {
    setMaintenance(s.maintenanceMode);
    setVisibleInApp(s.visibleInApp);
    setStatus(s.status);
    setTrialEndsAt(s.trialEndsAt ? new Date(s.trialEndsAt) : undefined);
    setSefazHomo(s.sefazHomologacao);
    setContingencia(s.contingenciaOffline);
  }, [s]);

  async function persistSettings(overrides: {
    maintenanceMode?: boolean;
    visibleInApp?: boolean;
    status?: StoreStatus;
    trialEndsAt?: Date | undefined;
    sefazHomologacao?: boolean;
    contingenciaOffline?: boolean;
  }) {
    const nextMaintenance = overrides.maintenanceMode ?? maintenance;
    const nextVisible = overrides.visibleInApp ?? visibleInApp;
    const nextStatus = overrides.status ?? status;
    const nextTrial = overrides.trialEndsAt !== undefined ? overrides.trialEndsAt : trialEndsAt;
    const nextSefaz = overrides.sefazHomologacao ?? sefazHomo;
    const nextContingencia = overrides.contingenciaOffline ?? contingencia;

    await settingsMutation.mutateAsync({
      maintenanceMode: nextMaintenance,
      visibleInApp: nextVisible,
      status: nextStatus,
      trialEndsAt: nextTrial ? nextTrial.toISOString().split("T")[0] : undefined,
      sefazHomologacao: nextSefaz,
      contingenciaOffline: nextContingencia,
    });
  }

  type ConfirmKey = "contingencia" | null;
  const [confirmOpen, setConfirmOpen] = useState<ConfirmKey>(null);

  async function handleConfirm() {
    if (confirmOpen === "contingencia") {
      setContingencia(true);
      await persistSettings({ contingenciaOffline: true });
    }
    setConfirmOpen(null);
  }

  const confirmContent: Record<
    Exclude<ConfirmKey, null>,
    { title: string; description: ReactNode; label: string; variant: "destructive" | "default" }
  > = {
    contingencia: {
      title: "Forçar contingência offline?",
      description: (
        <>
          O PDV de <strong>{detail.tradeName}</strong> passará a emitir NFC-e em modo
          contingência. As notas serão transmitidas à Sefaz assim que a conexão for
          restabelecida. Ative somente se a Sefaz do estado estiver fora do ar.
        </>
      ),
      label: "Forçar Contingência",
      variant: "destructive",
    },
  };

  const activeConfirm = confirmOpen ? confirmContent[confirmOpen] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] items-start">

      <div className="rounded-[10px] bg-muted p-2">
      <Accordion
        type="single"
        collapsible
        defaultValue="ciclo-de-vida"
        className="rounded-[10px] border bg-background"
      >
        {/* ── Ciclo de Vida ─────────────────────────────────────────── */}
        <AccordionItem value="ciclo-de-vida">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div className="flex flex-1 items-center justify-between gap-4 mr-3">
              <div>
                <p className="text-sm font-medium text-left">Ciclo de Vida</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                  Status de implantação, visibilidade no app e carência
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium shrink-0", lojaStatusConfig[status].className)}
              >
                {lojaStatusConfig[status].label}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t">
              <ControlRow
                title="Status de Implantação"
                description="Em Setup: oculta no app e sem cobrança. Em Treinamento: equipe pode testar. Produção: operação real."
              >
                <Select
                  value={status}
                  disabled={settingsMutation.isPending}
                  onValueChange={(v) => {
                    const next = v as StoreStatus;
                    setStatus(next);
                    if (next !== "PRODUCTION") setVisibleInApp(false);
                    void persistSettings({
                      status: next,
                      visibleInApp: next !== "PRODUCTION" ? false : visibleInApp,
                    });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_SETUP">Em Setup</SelectItem>
                    <SelectItem value="TRAINING">Em Treinamento</SelectItem>
                    <SelectItem value="PRODUCTION">Produção (Live)</SelectItem>
                    {status === "BLOCKED" && (
                      <SelectItem value="BLOCKED" disabled>Bloqueada</SelectItem>
                    )}
                    {status === "OFFLINE" && (
                      <SelectItem value="OFFLINE" disabled>Offline</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </ControlRow>

              <ControlRow
                title="Visível no App do Consumidor"
                description={
                  status !== "PRODUCTION"
                    ? "Disponível somente quando o status de implantação for Produção."
                    : "Se desativado, a loja fica oculta no app mesmo estando em Produção."
                }
              >
                <Switch
                  checked={visibleInApp}
                  disabled={status !== "PRODUCTION" || settingsMutation.isPending}
                  onCheckedChange={(v) => {
                    setVisibleInApp(v);
                    void persistSettings({ visibleInApp: v });
                  }}
                />
              </ControlRow>

              <ControlRow
                title="Data de Fim da Carência (Trial)"
                description="Até esta data a loja não será bloqueada automaticamente por inadimplência."
              >
                <DatePicker
                  value={trialEndsAt}
                  disabled={settingsMutation.isPending}
                  onChange={(d) => {
                    setTrialEndsAt(d);
                    void persistSettings({ trialEndsAt: d });
                  }}
                  placeholder="Sem carência"
                  className="w-44"
                />
              </ControlRow>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Operação ──────────────────────────────────────────────── */}
        <AccordionItem value="operacao">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div className="flex flex-1 items-center justify-between gap-4 mr-3">
              <div>
                <p className="text-sm font-medium text-left">Operação</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                  Manutenção da loja e ações de emergência operacional
                </p>
              </div>
              {maintenance && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold shrink-0 border-amber-300 bg-amber-50 text-amber-700"
                >
                  MANUTENÇÃO ATIVA
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t">
              <ControlRow
                title="Modo de Manutenção"
                description="O app do consumidor exibe 'Voltamos logo' e para de aceitar pedidos. O ERP da loja continua funcionando normalmente."
              >
                <Switch
                  checked={maintenance}
                  disabled={settingsMutation.isPending}
                  onCheckedChange={(v) => {
                    setMaintenance(v);
                    void persistSettings({ maintenanceMode: v });
                  }}
                />
              </ControlRow>

              <ControlRow
                title="Forçar Fechamento de Turno/Caixa"
                description="Use quando o lojista esqueceu de fechar o caixa e o sistema travou na virada do dia. Ação irreversível."
                danger
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Em breve"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <WrenchIcon className="mr-1.5 h-3.5 w-3.5" />
                  Forçar Fechamento
                </Button>
              </ControlRow>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Dados e Sincronização ─────────────────────────────────── */}
        <AccordionItem value="sincronizacao">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div>
              <p className="text-sm font-medium text-left">Dados e Sincronização</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                Cache, índices de busca e reenvio de catálogo para integrações
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t">
              <ControlRow
                title="Forçar Sincronização de Catálogo"
                description="Reenvia todos os produtos para o iFood e integrações. Use quando o lojista altera preços e as mudanças não aparecem."
              >
                <Button variant="outline" size="sm" disabled title="Em breve">
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Sincronizar
                </Button>
              </ControlRow>

              <ControlRow
                title="Reconstruir Índices de Busca"
                description="Remapeia todos os itens no motor de busca interno. Use quando produtos somem da pesquisa."
              >
                <Button variant="outline" size="sm" disabled title="Em breve">
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  Reconstruir
                </Button>
              </ControlRow>

              <ControlRow
                title="Limpar Cache da Loja"
                description="Remove dados em cache no servidor. Último recurso para inconsistências visuais que não resolvem com sync."
              >
                <Button variant="outline" size="sm" disabled title="Em breve">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Limpar Cache
                </Button>
              </ControlRow>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Fiscal e Contingência ─────────────────────────────────── */}
        <AccordionItem value="fiscal">
          <AccordionTrigger className="hover:no-underline px-5 py-4">
            <div className="flex flex-1 items-center justify-between gap-4 mr-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-sm font-medium text-destructive text-left">
                    Fiscal e Contingência
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 text-left">
                  Zona de risco — ações com impacto fiscal real
                </p>
              </div>
              {sefazHomo && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold shrink-0 border-amber-300 bg-amber-50 text-amber-700"
                >
                  HOMOLOGAÇÃO
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="divide-y border-t border-destructive/20">
              <ControlRow
                title="Modo de Homologação (Sefaz)"
                description="As notas emitidas NÃO geram obrigações fiscais reais. Use para testar emissão sem impacto no cliente."
              >
                <div className="flex items-center gap-2.5">
                  {sefazHomo && (
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold border-amber-300 bg-amber-50 text-amber-700"
                    >
                      HOMOLOGAÇÃO
                    </Badge>
                  )}
                  <Switch
                    checked={sefazHomo}
                    disabled={settingsMutation.isPending}
                    onCheckedChange={(v) => {
                      setSefazHomo(v);
                      void persistSettings({ sefazHomologacao: v });
                    }}
                  />
                </div>
              </ControlRow>

              <ControlRow
                title="Forçar Contingência Offline"
                description="O PDV passa a emitir NFC-e em contingência e transmite à Sefaz quando a conexão voltar. Ative somente se a Sefaz do estado estiver fora do ar."
                danger
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contingencia || settingsMutation.isPending}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  onClick={() => setConfirmOpen("contingencia")}
                >
                  <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
                  {contingencia ? "Ativa" : "Forçar Contingência"}
                </Button>
              </ControlRow>
            </div>

            <Separator className="mt-4 mb-3" />
            <p className="text-xs text-muted-foreground pb-1">
              Alterações nesta seção são registradas no log de auditoria da loja.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>

      <ContextPanel detail={detail} maintenance={maintenance} />

      </div>

      {activeConfirm && (
        <ConfirmDialog
          open={!!confirmOpen}
          onOpenChange={(open) => {
            if (!open) setConfirmOpen(null);
          }}
          title={activeConfirm.title}
          description={activeConfirm.description}
          confirmLabel={activeConfirm.label}
          cancelLabel="Cancelar"
          confirmVariant={activeConfirm.variant}
          isConfirming={settingsMutation.isPending}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </>
  );
}
