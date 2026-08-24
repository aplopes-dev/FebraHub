"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Divider, ScrollArea } from "@citybox/mui";
import { CustomerAddressesSection } from "@/features/customers/components/customer-addresses-section";
import { CustomerFormFooter } from "@/features/customers/components/customer-form-footer";
import { CustomerFormHeader } from "@/features/customers/components/customer-form-header";
import { CustomerPersonalSection } from "@/features/customers/components/customer-personal-section";
import { useCustomerForm } from "@/features/customers/hooks/use-customer-form";
import type { CustomerFormValues } from "@/features/customers/types/customer-form";

type CustomerFormViewProps = {
  title: string;
  customerId?: string;
  initialValues?: CustomerFormValues;
  formKey?: string;
};

export function CustomerFormView({
  title,
  customerId,
  initialValues,
  formKey,
}: CustomerFormViewProps) {
  return (
    <CustomerFormViewInner
      key={formKey ?? "create"}
      title={title}
      customerId={customerId}
      initialValues={initialValues}
    />
  );
}

function CustomerFormViewInner({
  title,
  customerId,
  initialValues,
}: {
  title: string;
  customerId?: string;
  initialValues?: CustomerFormValues;
}) {
  const router = useRouter();
  const { values, setField, isDirty, hasSavedOnce, isSaving, discard, save } =
    useCustomerForm({
      customerId,
      initialValues,
      onSaved: () => router.push("/clientes"),
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
        <Stack
          spacing={5}
          sx={{ px: 3, pt: 3, pb: 2, minWidth: 0, maxWidth: "100%" }}
        >
          <CustomerFormHeader title={title} />
          <CustomerPersonalSection values={values} onChange={setField} />
          <Divider />
          <CustomerAddressesSection
            addresses={values.addresses}
            onChange={(addresses) => setField("addresses", addresses)}
          />
        </Stack>
      </ScrollArea>

      <CustomerFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={save}
      />
    </Box>
  );
}
