"use client";

import { FormField } from "@citybox/mui";
import { MEMBER_PDV_PIN_LENGTH } from "@/features/users-permissions/types/user";

type MemberPdvPinFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  helperText?: string;
};

/**
 * Campo de PIN do caixa (4 dígitos).
 *
 * `type="password"` porque o gerente define o PIN com o funcionário do lado.
 * Só dígitos, cortados no comprimento — evita digitar 6 e receber 422 depois.
 */
export function MemberPdvPinField({
  id,
  label,
  value,
  onChange,
  autoFocus,
  helperText,
}: MemberPdvPinFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      type="password"
      value={value}
      autoFocus={autoFocus}
      helperText={helperText ?? `${MEMBER_PDV_PIN_LENGTH} dígitos`}
      slotProps={{
        htmlInput: {
          inputMode: "numeric",
          autoComplete: "off",
          maxLength: MEMBER_PDV_PIN_LENGTH,
        },
      }}
      onChange={(event) =>
        onChange(
          event.target.value.replace(/\D/g, "").slice(0, MEMBER_PDV_PIN_LENGTH),
        )
      }
    />
  );
}
