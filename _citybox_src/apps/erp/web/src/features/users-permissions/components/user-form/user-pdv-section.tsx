"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Button, FormField, toast } from "@citybox/mui";
import {
  formFieldGridSx,
  formFieldSpanSx as span,
  FormSection,
} from "@/components/ui/form";
import { MemberPdvPinDialog } from "@/features/users-permissions/components/user-form/member-pdv-pin-dialog";
import { useSetMemberPdvPinMutation } from "@/features/users-permissions/hooks/use-member-mutations";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";
import { updateMember } from "@/features/users-permissions/api/members.service";
import { ComercioApiError } from "@/lib/api/comercio-client";

export type UserPdvStatus = {
  hasPdvPin: boolean;
  pdvLocked: boolean;
  pdvLockedUntil: string | null;
  pdvPinUpdatedAt: string | null;
};

type UserPdvSectionProps = {
  form: UserFormApi;
  /** membershipId — ações de PIN na API só na edição. */
  memberId?: string;
  /** Status atual do servidor (só edição). */
  pdvStatus?: UserPdvStatus;
};

/**
 * Código + PIN de caixa do membro (credenciais PDV).
 *
 * No create o PIN fica em `pendingPdvPin` e é enviado após o membro nascer.
 * Na edição chama `PUT /v1/members/:id/pdv-pin` de imediato.
 */
export function UserPdvSection({
  form,
  memberId,
  pdvStatus,
}: UserPdvSectionProps) {
  const {
    values,
    setField,
    isEditing,
    pendingPdvPin,
    setPendingPdvPin,
  } = form;
  const pinMutation = useSetMemberPdvPinMutation();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [isPreparingPin, setIsPreparingPin] = useState(false);

  const hasPdvPinOnServer = pdvStatus?.hasPdvPin ?? false;
  const pdvLocked = pdvStatus?.pdvLocked ?? false;
  const pdvCodeFilled = values.pdvCode.trim().length > 0;
  const hasPendingPin = pendingPdvPin !== null && pendingPdvPin.length > 0;
  const pinConfigured = isEditing ? hasPdvPinOnServer : hasPendingPin;

  async function handleConfirmPin(pin: string) {
    const code = values.pdvCode.trim();
    if (!code) return;

    // Create: só guarda o PIN — o save aplica depois do createMember.
    if (!memberId || !isEditing) {
      setPendingPdvPin(pin);
      setPinDialogOpen(false);
      toast.success("PIN definido", {
        description: "Será gravado ao salvar o usuário.",
      });
      return;
    }

    setIsPreparingPin(true);
    try {
      try {
        await updateMember(memberId, { pdvCode: code });
      } catch (error) {
        toast.error("Não foi possível gravar o código PDV", {
          description:
            error instanceof ComercioApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : undefined,
        });
        return;
      }

      await pinMutation.mutateAsync({
        id: memberId,
        payload: { pin },
      });
      setPinDialogOpen(false);
    } catch {
      // Toast do PIN já disparado pela mutation.
    } finally {
      setIsPreparingPin(false);
    }
  }

  return (
    <>
      <FormSection
        title="Acesso ao PDV (caixa)"
        description="Código e PIN usados no ponto de venda. Quem opera o caixa digita o código e o PIN no terminal pareado."
      >
        <Box sx={formFieldGridSx}>
          <Box sx={span(6)}>
            <FormField
              label="Código PDV"
              value={values.pdvCode}
              onChange={(event) => setField("pdvCode", event.target.value)}
              helperText="Código curto digitado no caixa (ex.: 01)."
              slotProps={{ htmlInput: { maxLength: 16, autoComplete: "off" } }}
            />
          </Box>

          <Box sx={span(6)}>
            <Stack
              spacing={0.5}
              sx={{ height: "100%", justifyContent: "center" }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography variant="body2" color="text.secondary">
                  {pinConfigured
                    ? isEditing
                      ? "PIN configurado"
                      : "PIN definido (grava ao salvar)"
                    : "Sem PIN"}
                </Typography>
                {pdvLocked ? (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: "center" }}
                  >
                    <LockOutlinedIcon
                      sx={{ fontSize: 16, color: "error.main" }}
                    />
                    <Typography variant="body2" color="error.main">
                      Bloqueado
                    </Typography>
                  </Stack>
                ) : null}
                <Button
                  type="button"
                  variant="outlined"
                  disabled={!pdvCodeFilled || pinMutation.isPending}
                  onClick={() => setPinDialogOpen(true)}
                >
                  {pinConfigured
                    ? pdvLocked
                      ? "Redefinir PIN e liberar"
                      : "Redefinir PIN"
                    : "Definir PIN"}
                </Button>
              </Stack>
              {!pdvCodeFilled ? (
                <Typography variant="caption" color="text.secondary">
                  Informe o código PDV para definir o PIN.
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Box>
      </FormSection>

      <MemberPdvPinDialog
        open={pinDialogOpen}
        memberName={values.name || "este usuário"}
        locked={pdvLocked}
        hasPin={pinConfigured}
        isSaving={isPreparingPin || pinMutation.isPending}
        onOpenChange={setPinDialogOpen}
        onConfirm={(pin) => void handleConfirmPin(pin)}
      />
    </>
  );
}
