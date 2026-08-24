"use client";

import { useState } from "react";
import { Tab, Tabs } from "@citybox/mui";
import { FacilitaNfeIssuedTab } from "@/features/facilita-nfe/components/facilita-nfe-issued-tab";
import { FacilitaNfePlaceholderTab } from "@/features/facilita-nfe/components/facilita-nfe-placeholder-tab";

const RECEIVED_COLUMNS = [
  "Data de emissão",
  "Status",
  "Emitente",
  "Valor",
  "Número",
  "Série",
  "Modelo",
  "Origem",
  "Importado",
];

const SEND_HISTORY_COLUMNS = ["Solicitante", "Período", "E-mail", "Status", "Arquivos"];

type FacilitaNfeTab = "received" | "issued" | "send-history";

/**
 * Shell das 3 abas do mockup (FR-001). Só "Emitido" tem dado real nesta
 * entrega — "Recebido" e "Histórico de Envios" são placeholders (ver
 * `spec.md` `## Clarifications`).
 */
export function FacilitaNfeTabs() {
  const [tab, setTab] = useState<FacilitaNfeTab>("issued");

  return (
    <>
      <Tabs
        value={tab}
        onChange={(_, next: FacilitaNfeTab) => setTab(next)}
        sx={{
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
          "& .MuiTabs-indicator": { height: 2 },
        }}
      >
        <Tab
          value="received"
          label="Recebido"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="issued"
          label="Emitido"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="send-history"
          label="Histórico de Envios"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
      </Tabs>

      {tab === "received" ? (
        <FacilitaNfePlaceholderTab columns={RECEIVED_COLUMNS} />
      ) : tab === "issued" ? (
        <FacilitaNfeIssuedTab />
      ) : (
        <FacilitaNfePlaceholderTab columns={SEND_HISTORY_COLUMNS} />
      )}
    </>
  );
}
