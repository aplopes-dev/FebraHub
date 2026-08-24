export type DateRange = { from?: Date; to?: Date };

export type FilterOption = { value: string; label: string };

export type CheckboxFilterGroup = {
  type: 'checkbox';
  key: string;
  title: string;
  pillPrefix?: string;
  options: FilterOption[];
  column?: 'left' | 'right';
};

export type DatePresetFilterGroup = {
  type: 'date-preset';
  key: string;
  title: string;
  pillPrefix?: string;
  datePickerPillPrefix?: string;
  datePickerTriggerValue?: string;
  options: FilterOption[];
  column?: 'left' | 'right';
};

export type FilterGroupDef = CheckboxFilterGroup | DatePresetFilterGroup;

export type CheckboxFilterValue = string[];
export type DatePresetFilterValue = { preset: string | null; date?: Date | DateRange | null };
export type FilterGroupValue = CheckboxFilterValue | DatePresetFilterValue;
export type FilterValues = Record<string, FilterGroupValue>;

export function createEmptyValues(groups: FilterGroupDef[]): FilterValues {
  return Object.fromEntries(
    groups.map((g) => [
      g.key,
      g.type === 'date-preset' ? { preset: null, date: null } : [],
    ]),
  );
}

export function countActiveFilterValues(
  values: FilterValues,
  groups: FilterGroupDef[],
): number {
  return groups.reduce((count, group) => {
    const val = values[group.key];
    if (!val) return count;

    if (group.type === 'checkbox') {
      return count + (val as CheckboxFilterValue).length;
    }

    if (group.type === 'date-preset') {
      const dv = val as DatePresetFilterValue;
      if (!dv.preset) return count;
      if (
        group.datePickerTriggerValue &&
        dv.preset === group.datePickerTriggerValue &&
        !dv.date
      ) {
        return count;
      }
      return count + 1;
    }

    return count;
  }, 0);
}

export function hasActiveFilterValues(
  values: FilterValues,
  groups: FilterGroupDef[],
): boolean {
  return countActiveFilterValues(values, groups) > 0;
}
