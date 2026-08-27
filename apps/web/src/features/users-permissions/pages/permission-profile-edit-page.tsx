"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/ui";
import { BackButton } from "@/components/ui/form";
import { PermissionProfileFormView } from "@/features/users-permissions/components/permission-profile-list/permission-profile-form-view";
import { usePermissionProfileForm } from "@/features/users-permissions/hooks/use-permission-profile-form";
import { usePermissionProfileQuery } from "@/features/users-permissions/hooks/use-permission-profile-queries";
import {
  permissionProfileToFormValues,
  type PermissionProfile,
} from "@/features/users-permissions/types/permission-profile";

const LIST_PATH = "/settings/users-permissions/profiles";

type PermissionProfileEditPageProps = {
  profileId: string;
};

export function PermissionProfileEditPage({
  profileId,
}: PermissionProfileEditPageProps) {
  const profileQuery = usePermissionProfileQuery(profileId);

  if (profileQuery.isLoading) {
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

  if (!profileQuery.data || profileQuery.isError) {
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
          title="Perfil não encontrado"
          description="O perfil de acesso que você tentou abrir não existe mais ou foi removido."
          action={
            <BackButton href={LIST_PATH} label="Voltar para Perfis de Acesso" />
          }
        />
      </Box>
    );
  }

  return <PermissionProfileEditFormLoaded profile={profileQuery.data} />;
}

function PermissionProfileEditFormLoaded({
  profile,
}: {
  profile: PermissionProfile;
}) {
  const router = useRouter();
  const form = usePermissionProfileForm({
    profileId: profile.id,
    initialValues: permissionProfileToFormValues(profile),
    onSaved: () => router.push(LIST_PATH),
  });

  return (
    <PermissionProfileFormView
      form={form}
      backHref={LIST_PATH}
      isSystem={profile.isSystem}
    />
  );
}
