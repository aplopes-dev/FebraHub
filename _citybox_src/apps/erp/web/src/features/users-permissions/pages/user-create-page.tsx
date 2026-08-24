"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserFormView } from "@/features/users-permissions/components/user-form/user-form-view";
import { ProvisionalPasswordDialog } from "@/features/users-permissions/components/provisional-password-dialog";
import { useUserForm } from "@/features/users-permissions/hooks/use-user-form";
import { useActivePermissionProfileOptionsQuery } from "@/features/users-permissions/hooks/use-permission-profile-queries";
import type { CreateMemberResult } from "@/features/users-permissions/types/user";

const LIST_PATH = "/configuracoes/usuarios-permissoes";

export function UserCreatePage() {
  const router = useRouter();
  const profilesQuery = useActivePermissionProfileOptionsQuery();
  const profileOptions = profilesQuery.data ?? [];

  const [created, setCreated] = useState<CreateMemberResult | null>(null);

  const form = useUserForm({
    profileOptions,
    onCreated: (result) => setCreated(result),
  });

  return (
    <>
      <UserFormView
        form={form}
        profileOptions={profileOptions}
        backHref={LIST_PATH}
      />

      <ProvisionalPasswordDialog
        open={created != null}
        email={created?.member.email ?? ""}
        provisionalPassword={created?.provisionalPassword ?? ""}
        linkedExistingAccount={created?.linkedExistingAccount}
        onClose={() => {
          setCreated(null);
          router.push(LIST_PATH);
        }}
      />
    </>
  );
}
