"use client";

import { useMemo } from "react";
import { BranchFormView } from "@/features/branches/components/branch-form-view";
import { createEmptyBranchFormValues } from "@/features/branches/types/branch";

export function MatrixCreatePage() {
  const initialValues = useMemo(() => createEmptyBranchFormValues(), []);

  return (
    <BranchFormView
      title="Nova empresa matriz"
      subtitle="Matrizes e Filiais"
      unitKind="matrix"
      initialValues={initialValues}
    />
  );
}
