"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import Stack from "@mui/material/Stack";
import { Divider } from "@/ui";
import { CarrierFormHeader } from "@/features/carriers/components/carrier-form-header";
import { CarrierFormFooter } from "@/features/carriers/components/carrier-form-footer";
import { CarrierGeneralSection } from "@/features/carriers/components/carrier-general-section";
import { CarrierUnitsSection } from "@/features/carriers/components/carrier-units-section";
import { CarrierContactSection } from "@/features/carriers/components/carrier-contact-section";
import { CarrierAddressSection } from "@/features/carriers/components/carrier-address-section";
import { useCarrierForm } from "@/features/carriers/hooks/use-carrier-form";
import type { CarrierFormValues } from "@/features/carriers/types/carrier";

type CarrierFormViewProps = {
  title: string;
  carrierId?: string;
  initialValues?: CarrierFormValues;
};

export function CarrierFormView({
  title,
  carrierId,
  initialValues,
}: CarrierFormViewProps) {
  const router = useRouter();
  const { values, setField, isDirty, hasSavedOnce, isSaving, discard, save } =
    useCarrierForm({
      carrierId,
      initialValues,
      onSaved: () => router.push("/estoque/transportadoras"),
    });

  return (
    <Page
      footer={
        <CarrierFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={save}
        />
      }
    >
      <Stack spacing={5} sx={{ minWidth: 0 }}>
        <CarrierFormHeader title={title} />

        <CarrierGeneralSection values={values} onChange={setField} />

        <Divider />

        <CarrierUnitsSection
          selectedUnitIds={values.unitIds}
          onChange={(unitIds) => setField("unitIds", unitIds)}
        />

        <Divider />

        <CarrierContactSection
          value={values.contact}
          onChange={(contact) => setField("contact", contact)}
        />

        <Divider />

        <CarrierAddressSection
          value={values.address}
          onChange={(address) => setField("address", address)}
        />
      </Stack>
    </Page>
  );
}
