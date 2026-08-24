"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ScrollArea, Tab, Tabs } from "@citybox/mui";

import { EntityFormFooter } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";

import { useCompanySettingsForm } from "../hooks/use-company-settings-form";
import type { CompanySettingsTab } from "../types/company";
import { CompanyBillingTab } from "./company-billing-tab";
import { CompanyRegistrationTab } from "./company-registration-tab";
import { CompanyUsageTab } from "./company-usage-tab";

const SETTINGS_TABS: Array<{ value: CompanySettingsTab; label: string }> = [
  { value: "registration", label: "Cadastro" },
  { value: "billing", label: "Cobrança" },
  { value: "usage", label: "Definições de uso" },
];

function CompanySettingsSkeleton() {
  return (
    <Stack spacing={2} sx={{ py: 2 }} aria-busy aria-label="Carregando dados da empresa">
      <Box sx={{ height: 28, width: 220, borderRadius: 1, bgcolor: "action.hover" }} />
      <Box sx={{ height: 18, width: 360, borderRadius: 1, bgcolor: "action.hover" }} />
      <Box sx={{ height: 48, width: "100%", borderRadius: 1, bgcolor: "action.hover" }} />
      <Box sx={{ height: 200, width: "100%", borderRadius: 1, bgcolor: "action.hover" }} />
    </Stack>
  );
}

export function CompanySettingsView() {
  const [activeTab, setActiveTab] = useState<CompanySettingsTab>("registration");
  const form = useCompanySettingsForm();

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 4, minWidth: 0, maxWidth: "100%" }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Dados da empresa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cadastro, dados de cobrança e preferências de uso do sistema.
            </Typography>
          </Box>

          {form.loadError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar os dados da empresa"
              message={form.loadError}
              onRetry={form.reload}
            />
          ) : null}

          {!form.loadError ? (
            <>
              <Tabs
                value={activeTab}
                onChange={(_, next: CompanySettingsTab) => setActiveTab(next)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 48,
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTabs-indicator": { height: 2 },
                }}
              >
                {SETTINGS_TABS.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={tab.label}
                    sx={{
                      minHeight: 48,
                      px: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      color: "text.secondary",
                      "&.Mui-selected": { color: "primary.main" },
                    }}
                  />
                ))}
              </Tabs>

              {form.isLoading ? (
                <CompanySettingsSkeleton />
              ) : (
                <>
                  {activeTab === "registration" ? (
                    <CompanyRegistrationTab form={form} />
                  ) : null}
                  {activeTab === "billing" ? <CompanyBillingTab form={form} /> : null}
                  {activeTab === "usage" ? <CompanyUsageTab form={form} /> : null}
                </>
              )}
            </>
          ) : null}
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        ariaLabel="Ações dos dados da empresa"
        mode="dirty"
        isDirty={form.isDirty && !form.loadError && !form.isLoading}
        hasSavedOnce={form.hasSavedOnce}
        isSaving={form.isSaving}
        cancelLabel="Descartar alterações"
        saveLabel="Salvar"
        savedMessage="Configurações sincronizadas"
        onCancel={form.discard}
        onDiscard={form.discard}
        onSave={() => void form.save()}
      />
    </Box>
  );
}
