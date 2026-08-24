"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../atoms/tabs";
import { cn } from "../../../lib/utils";
import { TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS } from "../../../lib/tab-styles";

export interface PageTab {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface PageTabsProps {
  tabs: PageTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function PageTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}: PageTabsProps) {
  const fallback = defaultValue ?? tabs[0]?.value ?? "";

  return (
    <Tabs
      defaultValue={value === undefined ? fallback : undefined}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex flex-col gap-4", className)}
    >
      <TabsList className={cn(TAB_LIST_LINE_CLASS, listClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(TAB_TRIGGER_LINE_CLASS, triggerClassName)}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={cn("mt-0 focus-visible:outline-none", contentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
