'use client';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import {
  DEFAULT_TEAM_MEMBER_STATUS_FILTER,
  TEAM_MEMBER_STATUS_FILTER_OPTIONS,
  type TeamMemberStatusFilter,
} from '../lib/team-status-filter';

type TeamStatusFilterProps = {
  value: TeamMemberStatusFilter;
  onChange: (value: TeamMemberStatusFilter) => void;
};

export function TeamStatusFilter({ value, onChange }: TeamStatusFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor="team-status-filter" className="shrink-0 text-sm font-normal text-muted-foreground">
        Exibir:
      </Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as TeamMemberStatusFilter)}
      >
        <SelectTrigger id="team-status-filter" className="w-[10.5rem]">
          <SelectValue placeholder={DEFAULT_TEAM_MEMBER_STATUS_FILTER} />
        </SelectTrigger>
        <SelectContent>
          {TEAM_MEMBER_STATUS_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
