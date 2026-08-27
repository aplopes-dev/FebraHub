"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Divider, ScrollArea } from "@/ui";
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
      </ScrollArea>

      <CarrierFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={save}
      />
    </Box>
  );
}
