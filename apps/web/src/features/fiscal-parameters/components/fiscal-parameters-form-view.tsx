"use client";

import { Box, ScrollArea } from "@/ui";
import { FiscalInfoSection } from "@/features/fiscal-parameters/components/fiscal-info-section";
import { FiscalParametersFormFooter } from "@/features/fiscal-parameters/components/fiscal-parameters-form-footer";
import { FiscalParametersFormHeader } from "@/features/fiscal-parameters/components/fiscal-parameters-form-header";
import {
  FiscalSettingsSection,
  type FiscalBranchOption,
  type FiscalInheritedLabels,
} from "@/features/fiscal-parameters/components/fiscal-settings-section";
import { useFiscalParametersForm } from "@/features/fiscal-parameters/hooks/use-fiscal-parameters-form";
import type { FiscalParametersFormValues } from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalParametersFormViewProps = {
  productName: string;
  initialValues?: FiscalParametersFormValues;
  formKey?: string;
  branches?: FiscalBranchOption[];
  inherited?: FiscalInheritedLabels;
  onSave?: (values: FiscalParametersFormValues) => Promise<void> | void;
  isSaving?: boolean;
};

export function FiscalParametersFormView({
  productName,
  initialValues,
  formKey,
  branches = [],
  inherited,
  onSave,
  isSaving = false,
}: FiscalParametersFormViewProps) {
  return (
    <FiscalParametersFormViewInner
      key={formKey ?? "default"}
      productName={productName}
      initialValues={initialValues}
      branches={branches}
      inherited={inherited}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

function FiscalParametersFormViewInner({
  productName,
  initialValues,
  branches,
  inherited,
  onSave,
  isSaving,
}: {
  productName: string;
  initialValues?: FiscalParametersFormValues;
  branches: FiscalBranchOption[];
  inherited?: FiscalInheritedLabels;
  onSave?: (values: FiscalParametersFormValues) => Promise<void> | void;
  isSaving: boolean;
}) {
  const { values, setField, isDirty, hasSavedOnce, discard, save } =
    useFiscalParametersForm({ initialValues, onSave });

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, p: 3, pb: 2 }}>
          <FiscalParametersFormHeader productName={productName} />
          <FiscalInfoSection
            value={values.info}
            onChange={(info) => setField("info", info)}
          />
          <FiscalSettingsSection
            group={values.group}
            units={values.units}
            branches={branches}
            inherited={inherited}
            onGroupChange={(group) => setField("group", group)}
            onUnitsChange={(units) => setField("units", units)}
          />
        </Box>
      </ScrollArea>

      <FiscalParametersFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </Box>
  );
}
