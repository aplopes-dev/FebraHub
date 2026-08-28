"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { Alert, FormField } from "@/ui";
import {
  EntityFormFooter,
  EntityFormHeader,
  FormSection,
} from "@/components/ui/form";
import { PermissionTree } from "@/features/users-permissions/components/permission-tree/permission-tree";
import { usePermissionCatalogQuery } from "@/features/users-permissions/hooks/use-permission-catalog-query";
import type { PermissionProfileFormApi } from "@/features/users-permissions/hooks/use-permission-profile-form";

type PermissionProfileFormViewProps = {
  form: PermissionProfileFormApi;
  backHref: string;
  /** `true` = perfil de sistema (Administrador): campos bloqueados. */
  isSystem?: boolean;
};

export function PermissionProfileFormView({
  form,
  backHref,
  isSystem = false,
}: PermissionProfileFormViewProps) {
  const router = useRouter();
  const { values, setField, setPermissionIds } = form;
  const selected = new Set(values.permissionIds);
  const catalogQuery = usePermissionCatalogQuery();
  const groups = catalogQuery.data?.groups ?? [];

  return (
    <Page
      footer={
        <EntityFormFooter
          ariaLabel="Ações do perfil de acesso"
          mode="dirty"
          isDirty={form.isDirty && !isSystem}
          hasSavedOnce={form.hasSavedOnce}
          isSaving={form.isSaving}
          savedMessage="Perfil salvo"
          onCancel={() => router.push(backHref)}
          onDiscard={form.discard}
          onSave={() => void form.save()}
        />
      }
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <EntityFormHeader
          title={form.isEditing ? "Editar perfil" : "Novo perfil"}
          subtitle="Perfil de Acesso"
          backHref={backHref}
        />

        {isSystem ? (
          <Alert severity="info">
            O perfil Administrador é protegido — nome, descrição e permissões
            não podem ser alterados.
          </Alert>
        ) : null}

        <FormSection
          title="Informações gerais"
          description="Defina as informações principais deste perfil de acesso, incluindo nome e descrição."
        >
          <FormField
            label="Nome do perfil"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            disabled={isSystem}
            required
          />
          <FormField
            label="Descrição"
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
            disabled={isSystem}
            multiline
            minRows={3}
          />
        </FormSection>

        <FormSection
          title="Permissões"
          description="Módulos do sistema: comercial, CRM, acadêmico, eventos, mentoria, conteúdo, secretaria, financeiro e configurações."
        >
          <Box
            sx={{
              minWidth: 0,
              opacity: isSystem ? 0.6 : 1,
              pointerEvents: isSystem ? "none" : "auto",
            }}
          >
            {catalogQuery.isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : (
              <PermissionTree
                groups={groups}
                selected={selected}
                onChange={setPermissionIds}
              />
            )}
          </Box>
        </FormSection>
      </Stack>
    </Page>
  );
}
