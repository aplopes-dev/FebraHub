"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { FormSection } from "@/components/ui/form";
import { ProvisionalPasswordDialog } from "@/features/users-permissions/components/provisional-password-dialog";
import { useResetMemberPasswordMutation } from "@/features/users-permissions/hooks/use-member-mutations";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";

type UserPasswordSectionProps = {
  form: UserFormApi;
  /** membershipId — só na edição (create gera senha na resposta). */
  memberId?: string;
  memberEmail?: string;
};

/**
 * Na criação a API gera senha provisória — esta seção fica oculta.
 * Na edição: botão "Resetar senha" que devolve nova provisória.
 */
export function UserPasswordSection({
  form,
  memberId,
  memberEmail,
}: UserPasswordSectionProps) {
  const resetMutation = useResetMemberPasswordMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provisionalPassword, setProvisionalPassword] = useState("");

  if (!form.isEditing || !memberId) return null;

  return (
    <>
      <FormSection
        title="Senha de acesso"
        description="Gere uma nova senha provisória. A anterior deixa de valer e o sistema pedirá a troca no próximo login."
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Use quando a pessoa esquecer a senha ou no primeiro acesso sem
            provisória.
          </Typography>
          <Button
            type="button"
            variant="outlined"
            loading={resetMutation.isPending}
            disabled={resetMutation.isPending}
            onClick={async () => {
              const result = await resetMutation.mutateAsync(memberId);
              setProvisionalPassword(result.provisionalPassword);
              setDialogOpen(true);
            }}
          >
            Resetar senha
          </Button>
        </Box>
      </FormSection>

      <ProvisionalPasswordDialog
        open={dialogOpen}
        email={memberEmail ?? form.values.email}
        provisionalPassword={provisionalPassword}
        title="Nova senha provisória"
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
