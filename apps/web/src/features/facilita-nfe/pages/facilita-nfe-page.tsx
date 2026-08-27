"use client";

import { PageHeader } from "@/ui";
import { FacilitaNfeTabs } from "@/features/facilita-nfe/components/facilita-nfe-tabs";

export function FacilitaNfePage() {
  return (
    <>
      <PageHeader
        title="Facilita NFE"
        description="Documentos fiscais recebidos e emitidos pela loja."
      />
      <FacilitaNfeTabs />
    </>
  );
}
