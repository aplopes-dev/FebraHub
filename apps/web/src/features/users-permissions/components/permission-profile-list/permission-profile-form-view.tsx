"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { Alert, FormField, ScrollArea } from "@/ui";
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
    <Box
      component="section"
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
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 4, minWidth: 0 }}>
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
      </ScrollArea>

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
    </Box>
  );
}
