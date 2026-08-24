"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { useRouter } from "next/navigation";
import { EmptyState } from "@citybox/mui";
import { BackButton } from "@/components/ui/form";
import { UserFormView } from "@/features/users-permissions/components/user-form/user-form-view";
import { useUserForm } from "@/features/users-permissions/hooks/use-user-form";
import { useMemberQuery } from "@/features/users-permissions/hooks/use-member-queries";
import { useActivePermissionProfileOptionsQuery } from "@/features/users-permissions/hooks/use-permission-profile-queries";
import {
  userToFormValues,
  type PlatformUser,
} from "@/features/users-permissions/types/user";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";

const LIST_PATH = "/configuracoes/usuarios-permissoes";

type UserEditPageProps = {
  userId: string;
};

export function UserEditPage({ userId }: UserEditPageProps) {
  const memberQuery = useMemberQuery(userId);
  const profilesQuery = useActivePermissionProfileOptionsQuery();
  const profileOptions = profilesQuery.data ?? [];

  if (memberQuery.isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!memberQuery.data || memberQuery.isError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
          height: "100%",
        }}
      >
        <EmptyState
          icon={<InfoOutlined sx={{ fontSize: 24 }} />}
          title="Usuário não encontrado"
          description="O usuário que você tentou abrir não existe mais ou foi removido."
          action={
            <BackButton
              href={LIST_PATH}
              label="Voltar para Usuários e Permissões"
            />
          }
        />
      </Box>
    );
  }

  return (
    <UserEditFormLoaded
      user={memberQuery.data}
      profileOptions={profileOptions}
    />
  );
}

function UserEditFormLoaded({
  user,
  profileOptions,
}: {
  user: PlatformUser;
  profileOptions: PermissionProfileOption[];
}) {
  const router = useRouter();
  const form = useUserForm({
    userId: user.id,
    initialValues: userToFormValues(user),
    profileOptions,
    onSaved: () => router.push(LIST_PATH),
  });

  return (
    <UserFormView
      form={form}
      profileOptions={profileOptions}
      backHref={LIST_PATH}
      memberId={user.id}
      pdvStatus={{
        hasPdvPin: user.hasPdvPin,
        pdvLocked: user.pdvLocked,
        pdvLockedUntil: user.pdvLockedUntil,
        pdvPinUpdatedAt: user.pdvPinUpdatedAt,
      }}
    />
  );
}
