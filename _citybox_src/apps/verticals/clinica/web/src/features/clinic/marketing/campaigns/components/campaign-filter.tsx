'use client';

import { SelectField, SelectOption } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { FILTER_OPTIONS, StatusFilter } from "../constants";

type CampaignFilterProps = {
  value: StatusFilter;
  onValueChange: (value: StatusFilter) => void;
};

export function CampaignFilter({ value, onValueChange }: CampaignFilterProps) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
      <p className="shrink-0 text-sm text-foreground">Exibir por</p>
      <SelectField
        className="min-w-0 w-full rounded-md bg-background sm:min-w-48 sm:w-auto"
        label=""
        options={FILTER_OPTIONS as unknown as SelectOption[]}
        value={value}
        onValueChange={(newValue: string) => onValueChange(newValue as StatusFilter)}
      />
    </div>
  );
}
