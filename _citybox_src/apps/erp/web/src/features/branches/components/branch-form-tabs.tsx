"use client";

import { Tab, Tabs } from "@citybox/mui";

export type BranchFormTab = "registration" | "billing" | "usage";

type BranchFormTabsProps = {
  value: BranchFormTab;
  onValueChange: (value: BranchFormTab) => void;
  /**
   * Na criação só o Cadastro fica disponível — o resto depende da unidade já
   * existir (mesmo comportamento da referência).
   */
  isEditing: boolean;
};

export function BranchFormTabs({
  value,
  onValueChange,
  isEditing,
}: BranchFormTabsProps) {
  const tabSx = {
    minHeight: 48,
    px: 2,
    textTransform: "none" as const,
    fontWeight: 500,
    color: "text.secondary",
    "&.Mui-selected": { color: "primary.main" },
  };

  return (
    <Tabs
      value={value}
      onChange={(_, next: BranchFormTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 48,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      <Tab value="registration" label="Cadastro" sx={tabSx} />
      {/*
        Cobrança fica sempre desabilitada: a assinatura é da empresa, não da
        unidade (fica em Configurações → Dados da empresa). `Tabs` clona os
        filhos com props internas, então nada de wrapper (Tooltip/span) aqui —
        elas vazariam para o DOM.
      */}
      <Tab value="billing" label="Cobrança" disabled sx={tabSx} />
      <Tab
        value="usage"
        label="Definições de uso"
        disabled={!isEditing}
        sx={tabSx}
      />
    </Tabs>
  );
}
