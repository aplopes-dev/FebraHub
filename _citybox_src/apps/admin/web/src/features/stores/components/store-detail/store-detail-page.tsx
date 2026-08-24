"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@citybox/ui/atoms";
import type { LojaDetail } from "../../types";
import { EditStoreDialog } from "../edit-store-dialog";
import { StoreDetailHeader } from "./store-detail-header";
import { StoreOwnerCard } from "./store-owner-card";
import { OperationalTab } from "./tabs/operational-tab";
import { FiscalTab } from "./tabs/fiscal-tab";
import { PlanTab } from "./tabs/plan-tab";
import { BillingTab } from "./tabs/billing-tab";
import { SettingsTab } from "./tabs/settings-tab";
import { SolicitacoesTab } from "./tabs/solicitacoes-tab";
import { ModulesTab } from "./tabs/modules-tab";
import { LogsTab } from "./tabs/logs-tab";

// Override das classes base do TabsTrigger: flex-1 → flex-none, arredondamento só no topo, border transparente
// after:!bottom-[-1px] compensa o h-[calc(100%-1px)] padrão do componente, alinhando o indicador à border-b do TabsList
const TAB_TRIGGER =
  "!flex-none !rounded-t-md !rounded-bl-none !rounded-br-none !border-transparent px-6 py-3 text-sm font-medium text-muted-foreground " +
  "after:absolute after:inset-x-0 after:!bottom-[-1px] after:h-0.5 after:opacity-0 after:bg-primary " +
  "hover:bg-accent hover:text-foreground " +
  "data-[state=active]:!bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100 " +
  "data-active:!bg-transparent data-active:text-foreground data-active:shadow-none data-active:after:opacity-100";

interface StoreDetailPageProps {
  detail: LojaDetail;
}

export function StoreDetailPage({ detail }: StoreDetailPageProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Tabs defaultValue="raio-x" className="contents">
      <div className="-mx-4 -mb-4 -mt-4 flex min-h-full flex-1 flex-col">
        <StoreDetailHeader
          detail={detail}
          onEdit={() => setEditOpen(true)}
          onImpersonate={() =>
            console.log("Impersonation:", detail.id, detail.tradeName)
          }
        />

        {/* Navegação de tabs — visualmente colada ao cabeçalho */}
        <div className="bg-card px-6 border-b">
          <TabsList className="flex h-auto gap-3 rounded-none bg-transparent p-0">
            <TabsTrigger value="raio-x" className={TAB_TRIGGER}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="fiscal" className={TAB_TRIGGER}>
              Fiscal
            </TabsTrigger>
            <TabsTrigger value="plano" className={TAB_TRIGGER}>
              Plano
            </TabsTrigger>
            <TabsTrigger value="billing" className={TAB_TRIGGER}>
              Billing
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className={TAB_TRIGGER}>
              Configurações
            </TabsTrigger>
            {detail.vertical === "Clínica" ? (
              <TabsTrigger value="solicitacoes" className={TAB_TRIGGER}>
                Pacotes adicionais
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="modulos" className={TAB_TRIGGER}>
              Módulos
            </TabsTrigger>
            <TabsTrigger value="logs" className={TAB_TRIGGER}>
              Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-1 flex-col bg-muted/40 p-4 pt-4 gap-4">
          <TabsContent
            value="raio-x"
            className="mt-0 flex flex-col gap-3 focus-visible:outline-none"
          >
            {/* Primeiro bloco da visão geral: o operador precisa ver logo quem responde
                pela loja e se essa pessoa já consegue entrar no sistema. */}
            <StoreOwnerCard
              storeId={detail.id}
              teamSource={detail.teamSource}
              deploymentStatus={detail.deploymentStatus}
              vertical={detail.vertical}
              responsibleName={detail.responsibleName ?? null}
              billingEmail={detail.billingEmail ?? null}
            />
            <OperationalTab detail={detail} />
          </TabsContent>
          <TabsContent value="fiscal" className="mt-0 focus-visible:outline-none">
            <FiscalTab detail={detail} />
          </TabsContent>
          <TabsContent value="plano" className="mt-0 focus-visible:outline-none">
            <PlanTab detail={detail} />
          </TabsContent>
          <TabsContent value="billing" className="mt-0 focus-visible:outline-none">
            <BillingTab detail={detail} />
          </TabsContent>
          <TabsContent value="configuracoes" className="mt-0 focus-visible:outline-none">
            <SettingsTab detail={detail} />
          </TabsContent>
          {detail.vertical === "Clínica" ? (
            <TabsContent
              value="solicitacoes"
              className="mt-0 focus-visible:outline-none"
            >
              <SolicitacoesTab storeId={detail.id} />
            </TabsContent>
          ) : null}
          <TabsContent value="modulos" className="mt-0 focus-visible:outline-none">
            <ModulesTab
              storeId={detail.id}
              modules={detail.modules}
              integrations={detail.integrations}
            />
          </TabsContent>

          <TabsContent value="logs" className="mt-0 focus-visible:outline-none">
            <LogsTab storeId={detail.id} />
          </TabsContent>
        </div>
      </div>

      <EditStoreDialog
        open={editOpen}
        loja={detail}
        onOpenChange={setEditOpen}
      />
    </Tabs>
  );
}
