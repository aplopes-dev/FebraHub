"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/ui";
import { EntityFormFooter, EntityFormHeader } from "@/components/ui/form";
import { UserGeneralSection } from "@/features/users-permissions/components/user-form/user-general-section";
import { UserPasswordSection } from "@/features/users-permissions/components/user-form/user-password-section";
import { UserScopeSection } from "@/features/users-permissions/components/user-form/user-scope-section";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";

type UserFormViewProps = {
  form: UserFormApi;
  profileOptions: PermissionProfileOption[];
  backHref: string;
  /** membershipId na edição (reset de senha). */
  memberId?: string;
};

/**
 * Settings de e-mails legados ficam fora — a API ainda não persiste esses
 * campos. Papel funcional e escopo hierárquico estão nas seções Geral e Escopo.
 */
export function UserFormView({
  form,
  profileOptions,
  backHref,
  memberId,
}: UserFormViewProps) {
  const router = useRouter();

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
            title={form.isEditing ? "Editar usuário" : "Novo usuário"}
            subtitle="Usuários"
            backHref={backHref}
          />

          <UserGeneralSection form={form} profileOptions={profileOptions} />
          <UserScopeSection form={form} />
          <UserPasswordSection
            form={form}
            memberId={memberId}
            memberEmail={form.values.email}
          />
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        ariaLabel="Ações do usuário"
        mode="dirty"
        isDirty={form.isDirty}
        hasSavedOnce={form.hasSavedOnce}
        isSaving={form.isSaving}
        savedMessage="Usuário salvo"
        onCancel={() => router.push(backHref)}
        onDiscard={form.discard}
        onSave={() => void form.save()}
      />
    </Box>
  );
}
