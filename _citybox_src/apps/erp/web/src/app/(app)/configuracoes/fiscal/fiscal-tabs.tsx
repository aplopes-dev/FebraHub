"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tab, Tabs } from "@citybox/mui";
import { PageHeader } from "@citybox/mui";
import { FiscalScrollablePage } from "@/components/ui/form";
import { FiscalCertificateTab } from "@/features/fiscal-certificate";
import { FiscalSettingsTab } from "@/features/fiscal-settings";
import { confirmDiscardIfDirty } from "@/features/fiscal-settings/lib/unsaved-guard";
import { FiscalSeriesTab } from "@/features/fiscal-invoice-series";
import { PosFiscalTypeTab } from "@/features/pos-fiscal-document-type";
import { FiscalDefaultTaxesTab } from "@/features/fiscal-default-taxes";

type FiscalTab = "certificado" | "geral" | "pdv" | "padroes" | "series";
const VALID_TABS: FiscalTab[] = [
  "certificado",
  "geral",
  "pdv",
  "padroes",
  "series",
];

/**
 * Tela Fiscal com abas (spec erp/010–012, FR-011/FR-007). Aba ativa refletida na
 * URL (`?aba=`) — compartilhável e recarregável, sem criar rota nova.
 */
export function FiscalTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("aba");
  const active: FiscalTab =
    raw && VALID_TABS.includes(raw as FiscalTab)
      ? (raw as FiscalTab)
      : "certificado";

  function handleChange(next: FiscalTab) {
    if (next === active) return;
    // Aviso de alterações não salvas ao sair da aba Configurações gerais (SC-005).
    if (!confirmDiscardIfDirty()) return;
    const params = new URLSearchParams(searchParams);
    params.set("aba", next);
    router.replace(`/configuracoes/fiscal?${params.toString()}`);
  }

  return (
    <FiscalScrollablePage>
      <PageHeader
        title="Fiscal"
        description="Certificado digital, configurações gerais e séries de numeração das notas fiscais."
      />

      <Tabs
        value={active}
        aria-label="Seções de configuração fiscal"
        onChange={(_, next: FiscalTab) => handleChange(next)}
        sx={{
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": { height: 2 },
        }}
      >
        <Tab
          value="certificado"
          label="Certificado"
          id="fiscal-tab-certificado"
          aria-controls="fiscal-tabpanel-certificado"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="geral"
          label="Configurações gerais"
          id="fiscal-tab-geral"
          aria-controls="fiscal-tabpanel-geral"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="pdv"
          label="Tipo de NF (PDV)"
          id="fiscal-tab-pdv"
          aria-controls="fiscal-tabpanel-pdv"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="padroes"
          label="Padrões fiscais"
          id="fiscal-tab-padroes"
          aria-controls="fiscal-tabpanel-padroes"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
        <Tab
          value="series"
          label="Séries"
          id="fiscal-tab-series"
          aria-controls="fiscal-tabpanel-series"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
      </Tabs>

      <div
        role="tabpanel"
        id={`fiscal-tabpanel-${active}`}
        aria-labelledby={`fiscal-tab-${active}`}
      >
        {active === "geral" ? (
          <FiscalSettingsTab />
        ) : active === "pdv" ? (
          <PosFiscalTypeTab />
        ) : active === "padroes" ? (
          <FiscalDefaultTaxesTab />
        ) : active === "series" ? (
          <FiscalSeriesTab />
        ) : (
          <FiscalCertificateTab />
        )}
      </div>
    </FiscalScrollablePage>
  );
}
