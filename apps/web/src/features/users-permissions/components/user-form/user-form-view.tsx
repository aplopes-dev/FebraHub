"use client";

import { Page } from "@/components/ui/page";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { EntityFormFooter, EntityFormHeader } from "@/components/ui/form";
import { UserGeneralSection } from "@/features/users-permissions/components/user-form/user-general-section";
import { UserPasswordSection } from "@/features/users-permissions/components/user-form/user-password-section";
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
    <Page
      footer={
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
      }
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <EntityFormHeader
          title={form.isEditing ? "Editar usuário" : "Novo usuário"}
          subtitle="Usuários"
          backHref={backHref}
        />

        <UserGeneralSection form={form} profileOptions={profileOptions} />
        <UserPasswordSection
          form={form}
          memberId={memberId}
          memberEmail={form.values.email}
        />
      </Stack>
    </Page>
  );
}
