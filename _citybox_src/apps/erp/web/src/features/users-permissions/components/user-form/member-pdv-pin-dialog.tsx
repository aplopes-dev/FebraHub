"use client";

import { useState } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@citybox/mui";
import { MemberPdvPinField } from "@/features/users-permissions/components/user-form/member-pdv-pin-field";
import { MEMBER_PDV_PIN_LENGTH } from "@/features/users-permissions/types/user";

type MemberPdvPinDialogProps = {
  open: boolean;
  memberName: string;
  /** Travado por tentativas erradas — muda o texto do diálogo. */
  locked: boolean;
  /** Já tem PIN → "Redefinir"; senão → "Definir". */
  hasPin: boolean;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => void;
};

/**
 * Definição/redefinição de PIN, isolada do formulário.
 *
 * Também destrava: `PUT …/pdv-pin` zera as tentativas erradas.
 */
export function MemberPdvPinDialog({
  open,
  memberName,
  locked,
  hasPin,
  isSaving = false,
  onOpenChange,
  onConfirm,
}: MemberPdvPinDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      <MemberPdvPinDialogBody
        key={`${memberName}-${String(open)}`}
        memberName={memberName}
        locked={locked}
        hasPin={hasPin}
        isSaving={isSaving}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    </Dialog>
  );
}

function MemberPdvPinDialogBody({
  memberName,
  locked,
  hasPin,
  isSaving,
  onOpenChange,
  onConfirm,
}: {
  memberName: string;
  locked: boolean;
  hasPin: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const complete = pin.length === MEMBER_PDV_PIN_LENGTH;
  const matches = pin === confirmation;
  const canSave = complete && matches;
  const title = hasPin ? "Redefinir PIN" : "Definir PIN";

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {hasPin ? "Novo PIN" : "PIN"} de <strong>{memberName}</strong> para
          acessar o caixa.
          {locked
            ? " O acesso está bloqueado por tentativas erradas — redefinir libera o PDV."
            : null}
        </Typography>

        <MemberPdvPinField
          id="member-pdv-new-pin"
          label={hasPin ? "Novo PIN" : "PIN"}
          value={pin}
          onChange={setPin}
          autoFocus
        />

        <MemberPdvPinField
          id="member-pdv-new-pin-confirm"
          label="Confirmar PIN"
          value={confirmation}
          onChange={setConfirmation}
          helperText={
            confirmation && !matches ? "Os PINs não coincidem" : "Repita o PIN"
          }
        />
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          disabled={isSaving}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSave}
          loading={isSaving}
          onClick={() => onConfirm(pin)}
        >
          {hasPin ? "Redefinir" : "Definir"}
        </Button>
      </DialogActions>
    </>
  );
}
