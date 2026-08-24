"use client";

import { useMemo, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@citybox/ui/atoms";
import { useFinancialPermissions } from "../hooks/use-financial-permissions";
import { FinancialAccountsSection } from "./components/accounts/financial-accounts-section";
import { ExpenseCategoriesSection } from "./components/expense-categories/expense-categories-section";
import { IncomeCategoriesSection } from "./components/income-categories/income-categories-section";

export function FinancialSettingsPageContainer() {
  const { canAccessAccountSettings, canAccessCategorySettings } =
    useFinancialPermissions();

  const tabs = useMemo(() => {
    const next: {
      value: string;
      label: string;
      content: ReactNode;
    }[] = [];
    if (canAccessAccountSettings) {
      next.push({
        value: "accounts",
        label: "Contas Financeiras",
        content: <FinancialAccountsSection />,
      });
    }
    if (canAccessCategorySettings) {
      next.push(
        {
          value: "expense-categories",
          label: "Categorias de Despesa",
          content: <ExpenseCategoriesSection />,
        },
        {
          value: "income-categories",
          label: "Categorias de Receita",
          content: <IncomeCategoriesSection />,
        },
      );
    }
    return next;
  }, [canAccessAccountSettings, canAccessCategorySettings]);

  const defaultValue = tabs[0]?.value ?? "accounts";

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Tabs defaultValue={defaultValue} className="flex flex-col gap-4">
      <div className="flex w-full items-center justify-start">
        <TabsList className="h-10 w-full justify-start rounded-xl bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none rounded-lg px-4"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-0 focus-visible:outline-none"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
