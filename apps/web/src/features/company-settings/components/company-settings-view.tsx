"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ScrollArea } from "@/ui";
import { PAGE_PADDING } from "@/ui/templates/page-metrics";

import { EntityFormFooter } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";

import { useCompanySettingsForm } from "../hooks/use-company-settings-form";
import { CompanyRegistrationTab } from "./company-registration-tab";

function CompanySettingsSkeleton() {
  return (
    <Stack
      spacing={2}
      sx={{ py: 2 }}
      aria-busy
      aria-label="Carregando dados do grupo"
    >
      <Box sx={{ height: 28, width: 220, borderRadius: 1, bgcolor: "action.hover" }} />
      <Box sx={{ height: 18, width: 360, borderRadius: 1, bgcolor: "action.hover" }} />
      <Box sx={{ height: 200, width: "100%", borderRadius: 1, bgcolor: "action.hover" }} />
    </Stack>
  );
}

export function CompanySettingsView() {
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
        // Full-bleed cancela o `p: PAGE_PADDING` do `<main>`.
        // `alignSelf: flex-start` + largura explícita evita o bug do flex em que
        // margem horizontal negativa amplia a largura esticada e corta o footer.
        alignSelf: "flex-start",
        width: (theme) => `calc(100% + ${theme.spacing(PAGE_PADDING * 2)})`,
        maxWidth: (theme) => `calc(100% + ${theme.spacing(PAGE_PADDING * 2)})`,
        ml: -PAGE_PADDING,
        mr: 0,
        mt: -PAGE_PADDING,
        mb: -PAGE_PADDING,
        boxSizing: "border-box",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Stack
          spacing={3}
          sx={{ px: PAGE_PADDING, pt: PAGE_PADDING, pb: 4, minWidth: 0, maxWidth: "100%" }}
        >
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Dados da empresa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cadastro do grupo — identificação e contato institucional.
            </Typography>
          </Box>

          {form.loadError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar os dados do grupo"
              message={form.loadError}
              onRetry={form.reload}
            />
          ) : null}

          {!form.loadError ? (
            form.isLoading ? (
              <CompanySettingsSkeleton />
            ) : (
              <CompanyRegistrationTab form={form} />
            )
          ) : null}
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        ariaLabel="Ações dos dados do grupo"
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
