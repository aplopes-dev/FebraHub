"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Divider, ScrollArea } from "@/ui";
import { SupplierFormHeader } from "@/features/suppliers/components/supplier-form-header";
import { SupplierFormFooter } from "@/features/suppliers/components/supplier-form-footer";
import { SupplierGeneralSection } from "@/features/suppliers/components/supplier-general-section";
import { SupplierContactSection } from "@/features/suppliers/components/supplier-contact-section";
import { SupplierAddressSection } from "@/features/suppliers/components/supplier-address-section";
import { useSupplierForm } from "@/features/suppliers/hooks/use-supplier-form";
import type { SupplierFormValues } from "@/features/suppliers/types/supplier";

type SupplierFormViewProps = {
  title: string;
  supplierId?: string;
  initialValues?: SupplierFormValues;
};

export function SupplierFormView({
  title,
  supplierId,
  initialValues,
}: SupplierFormViewProps) {
  const router = useRouter();
  const {
    values,
    setField,
    isDirty,
    hasSavedOnce,
    isSaving,
    discard,
    save,
  } = useSupplierForm({
    supplierId,
    initialValues,
    onSaved: () => router.push("/estoque/fornecedores"),
  });

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Stack spacing={5} sx={{ px: 3, pt: 3, pb: 2, minWidth: 0 }}>
          <SupplierFormHeader title={title} />

          <SupplierGeneralSection values={values} onChange={setField} />

          <Divider />

          <SupplierContactSection
            value={values.contact}
            onChange={(contact) => setField("contact", contact)}
          />

          <Divider />

          <SupplierAddressSection
            value={values.address}
            onChange={(address) => setField("address", address)}
            resetToken={supplierId ?? "new"}
          />
        </Stack>
      </ScrollArea>

      <SupplierFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={save}
      />
    </Box>
  );
}
