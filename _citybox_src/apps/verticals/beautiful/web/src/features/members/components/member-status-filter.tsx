'use client';

import { Box, FormControl, MenuItem, Select, Stack } from '@citybox/mui/atoms';
import { MEMBER_STATUS_FILTER_OPTIONS, type MemberStatusFilter } from '../lib/member-status-filter';

type MemberStatusFilterProps = {
  value: MemberStatusFilter;
  onChange: (value: MemberStatusFilter) => void;
};

export function MemberStatusFilter({ value, onChange }: MemberStatusFilterProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Box
        component="label"
        htmlFor="member-status-filter"
        sx={{
          fontSize: '0.875rem',
          color: (theme) =>
            theme.palette.mode === 'dark' ? 'oklch(0.708 0 0)' : 'oklch(0.556 0 0)',
        }}
      >
        Exibir:
      </Box>
      <FormControl size="small" sx={{ minWidth: 168 }}>
        <Select
          id="member-status-filter"
          value={value}
          displayEmpty
          onChange={(event) => onChange(event.target.value as MemberStatusFilter)}
          inputProps={{ 'aria-label': 'Filtrar membros por status' }}
        >
          {MEMBER_STATUS_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
