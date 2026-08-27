"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea } from "@/ui";
import { EntityFormFooter, EntityFormHeader } from "@/components/ui/form";
import { CompanyLogoField } from "@/features/company-settings/components/company-logo-field";
import { BranchAddressSection } from "@/features/branches/components/branch-address-section";
import {
  BranchFormTabs,
  type BranchFormTab,
} from "@/features/branches/components/branch-form-tabs";
import { BranchGeneralSection } from "@/features/branches/components/branch-general-section";
import { ParentMatrixBanner } from "@/features/branches/components/parent-matrix-banner";
import { useBranchForm } from "@/features/branches/hooks/use-branch-form";
import { useMatrixQuery } from "@/features/branches/hooks/use-branch-queries";
import type { BranchFormValues, UnitKind } from "@/features/branches/types/branch";

const LIST_PATH = "/settings/units";

type BranchFormViewProps = {
  title: string;
  subtitle?: string;
  unitKind: UnitKind;
  unitId?: string;
  matrixId?: string;
  initialValues?: BranchFormValues;
  initialHasLogo?: boolean;
  initialLogoCacheKey?: string | null;
};

export function BranchFormView({
  title,
  subtitle,
  unitKind,
  unitId,
  matrixId,
  initialValues,
  initialHasLogo,
  initialLogoCacheKey,
}: BranchFormViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BranchFormTab>("registration");

  const form = useBranchForm({
    unitKind,
    unitId,
    matrixId,
    initialValues,
    initialHasLogo,
    initialLogoCacheKey,
    onSaved: () => router.push(LIST_PATH),
  });

  const isStore = unitKind === "store";
  const matrixQuery = useMatrixQuery(isStore ? (matrixId ?? "") : "");

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
            subtitle={isStore ? "Filial" : subtitle}
            backHref={LIST_PATH}
          />

          {isStore ? (
            <ParentMatrixBanner
              matrix={matrixQuery.data ?? null}
              isLoading={matrixQuery.isLoading}
              isError={matrixQuery.isError}
            />
          ) : null}

          <BranchFormTabs value={activeTab} onValueChange={setActiveTab} />

          <Stack spacing={5}>
            <BranchGeneralSection
              values={form.values}
              isEditing={form.isEditing}
              onChange={form.setField}
              unitKind={unitKind}
              aside={
                <CompanyLogoField
                  previewUrl={form.logoPreviewUrl}
                  onSelect={form.setLogoFile}
                  onRemove={form.removeLogo}
                  disabled={form.isSaving}
                />
              }
            />
            <BranchAddressSection
              address={form.values.address}
              onChange={form.setAddressField}
              onPatch={form.patchAddress}
              resetToken={unitId ?? matrixId ?? "new"}
            />
          </Stack>
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        ariaLabel="Ações da unidade"
        mode="dirty"
        isDirty={form.isDirty}
        hasSavedOnce={form.hasSavedOnce}
        isSaving={form.isSaving}
        cancelLabel="Cancelar"
        saveLabel="Salvar"
        savedMessage="Unidade salva"
        onCancel={() => router.push(LIST_PATH)}
        onDiscard={form.discard}
        onSave={() => void form.save()}
      />
    </Box>
  );
}
