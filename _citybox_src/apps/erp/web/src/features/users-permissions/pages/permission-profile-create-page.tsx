"use client";

import { useRouter } from "next/navigation";
import { PermissionProfileFormView } from "@/features/users-permissions/components/permission-profile-list/permission-profile-form-view";
import { usePermissionProfileForm } from "@/features/users-permissions/hooks/use-permission-profile-form";

export function PermissionProfileCreatePage() {
  const router = useRouter();
  const form = usePermissionProfileForm({
    onSaved: () => router.push("/configuracoes/usuarios-permissoes/perfis"),
  });

  return (
    <PermissionProfileFormView form={form} backHref="/configuracoes/usuarios-permissoes/perfis" />
  );
}
