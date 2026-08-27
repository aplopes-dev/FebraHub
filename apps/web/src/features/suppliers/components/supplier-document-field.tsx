"use client";

import { useMaskInput } from "use-mask-input";
import { FormField } from "@/ui";
import {
  documentLabel,
  type PersonType,
} from "@/features/suppliers/types/supplier";

type SupplierDocumentFieldProps = {
  personType: PersonType;
  value: string;
  onChange: (value: string) => void;
};

const CPF_MASK = "999.999.999-99";
const CNPJ_MASK = "99.999.999/9999-99";

type MaskedDocumentInputProps = {
  personType: PersonType;
  mask: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Hook + input no mesmo nível com `key={personType}` no pai — o
 * `useMaskInput` não reaplica a máscara se só o prop `mask` mudar.
 */
function MaskedDocumentInput({
  personType,
  mask,
  value,
  onChange,
}: MaskedDocumentInputProps) {
  const inputRef = useMaskInput({ mask });

  return (
    <FormField
      id="sup-document"
      label={documentLabel(personType)}
      value={value}
      inputRef={inputRef}
      placeholder={
        personType === "juridica" ? "00.000.000/0000-00" : "000.000.000-00"
      }
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: {
          inputMode: "numeric",
          autoComplete: "off",
        },
      }}
    />
  );
}

export function SupplierDocumentField({
  personType,
  value,
  onChange,
}: SupplierDocumentFieldProps) {
  const mask = personType === "juridica" ? CNPJ_MASK : CPF_MASK;

  return (
    <MaskedDocumentInput
      key={personType}
      personType={personType}
      mask={mask}
      value={value}
      onChange={onChange}
    />
  );
}
