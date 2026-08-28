"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import Stack from "@mui/material/Stack";
import { Divider } from "@/ui";
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
    <Page
      footer={
        <SupplierFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={save}
        />
      }
    >
      <Stack spacing={5} sx={{ minWidth: 0 }}>
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
    </Page>
  );
}
