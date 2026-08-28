"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import Stack from "@mui/material/Stack";
import { Divider } from "@/ui";
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
    <Page
      footer={
        <CustomerFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={save}
        />
      }
    >
      <Stack
        spacing={5}
        sx={{ minWidth: 0, maxWidth: "100%" }}
      >
        <CustomerFormHeader title={title} />
        <CustomerPersonalSection values={values} onChange={setField} />
        <Divider />
        <CustomerAddressesSection
          addresses={values.addresses}
          onChange={(addresses) => setField("addresses", addresses)}
        />
      </Stack>
    </Page>
  );
}
