"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea } from "@citybox/mui";
import { EntityFormFooter, EntityFormHeader } from "@/components/ui/form";
import { BranchAddressSection } from "@/features/branches/components/branch-address-section";
import {
  BranchFormTabs,
  type BranchFormTab,
} from "@/features/branches/components/branch-form-tabs";
import { BranchGeneralSection } from "@/features/branches/components/branch-general-section";
import { BranchUsageSection } from "@/features/branches/components/branch-usage-section";
import { useBranchForm } from "@/features/branches/hooks/use-branch-form";
import type { BranchFormValues } from "@/features/branches/types/branch";

const LIST_PATH = "/configuracoes/unidades-filiais";

type BranchFormViewProps = {
  title: string;
  subtitle?: string;
  branchId?: string;
  initialValues?: BranchFormValues;
};

export function BranchFormView({
  title,
  subtitle,
  branchId,
  initialValues,
}: BranchFormViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BranchFormTab>("registration");

  const {
    values,
    setField,
    setAddressField,
    isDirty,
    hasSavedOnce,
    isSaving,
    isEditing,
    discard,
    save,
  } = useBranchForm({
    branchId,
    initialValues,
    onSaved: () => router.push(LIST_PATH),
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
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 4, minWidth: 0 }}>
          <EntityFormHeader
            title={title}
            subtitle={subtitle}
            backHref={LIST_PATH}
          />

          <BranchFormTabs
            value={activeTab}
            onValueChange={setActiveTab}
            isEditing={isEditing}
          />

          {activeTab === "registration" ? (
            <Stack spacing={5}>
              <BranchGeneralSection
                values={values}
                isEditing={isEditing}
                onChange={setField}
              />
              <BranchAddressSection
                address={values.address}
                onChange={setAddressField}
              />
            </Stack>
          ) : null}

          {activeTab === "usage" ? (
            <BranchUsageSection values={values} onChange={setField} />
          ) : null}
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        ariaLabel="Ações da unidade"
        mode="dirty"
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        cancelLabel="Cancelar"
        saveLabel="Salvar"
        savedMessage="Unidade salva"
        onCancel={() => router.push(LIST_PATH)}
        onDiscard={discard}
        onSave={save}
      />
    </Box>
  );
}
