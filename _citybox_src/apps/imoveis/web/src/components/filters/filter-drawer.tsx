'use client';

import { useMemo, useState } from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Drawer } from '@citybox/mui/molecules';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  countActiveFilterValues,
  createEmptyValues,
  type CheckboxFilterGroup,
  type CheckboxFilterValue,
  type FilterGroupDef,
  type FilterValues,
} from './filter-types';

type FilterDrawerProps = {
  groups: FilterGroupDef[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
  triggerLabel?: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        mb: 1.25,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  );
}

function CheckboxGroupSection({
  group,
  values,
  onValuesChange,
}: {
  group: CheckboxFilterGroup;
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
}) {
  const selected = (values[group.key] as CheckboxFilterValue) ?? [];

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onValuesChange({ ...values, [group.key]: next });
  }

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <SectionTitle>{group.title}</SectionTitle>
      <Stack spacing={1}>
        {group.options.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                size="small"
              />
            }
            label={option.label}
            sx={{ mx: 0, '& .MuiFormControlLabel-label': { fontSize: 14 } }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function splitGroups(
  groups: FilterGroupDef[],
): [FilterGroupDef[], FilterGroupDef[]] {
  const left = groups.filter((g, i) => {
    if (g.column === 'left') return true;
    if (g.column === 'right') return false;
    return i < Math.ceil(groups.length / 2);
  });
  const right = groups.filter((g, i) => {
    if (g.column === 'right') return true;
    if (g.column === 'left') return false;
    return i >= Math.ceil(groups.length / 2);
  });
  return [left, right];
}

export function FilterDrawer({
  groups,
  values,
  onValuesChange,
  triggerLabel,
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilterValues(values, groups);
  const emptyValues = useMemo(() => createEmptyValues(groups), [groups]);
  const [leftGroups, rightGroups] = useMemo(() => splitGroups(groups), [groups]);

  return (
    <>
      {triggerLabel ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<TuneIcon fontSize="small" />}
          onClick={() => setOpen(true)}
          sx={{ position: 'relative' }}
        >
          {triggerLabel}
          {activeCount > 0 ? (
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 16,
                height: 16,
                px: 0.5,
                borderRadius: 999,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeCount}
            </Box>
          ) : null}
        </Button>
      ) : (
        <IconButton
          aria-label="Filtrar"
          onClick={() => setOpen(true)}
          sx={{
            position: 'relative',
            width: 56,
            height: 56,
            borderRadius: 999,
            bgcolor: (theme) => listifyElevatedSurface(theme),
            color: activeCount > 0 ? 'primary.main' : 'text.primary',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
            '&:hover': { bgcolor: 'secondary.main' },
          }}
        >
          <TuneIcon sx={{ fontSize: 24 }} />
          {activeCount > 0 ? (
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                minWidth: 16,
                height: 16,
                px: 0.5,
                borderRadius: 999,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeCount}
            </Box>
          ) : null}
        </IconButton>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        width={560}
        footer={
          activeCount > 0 ? (
            <Button
              variant="text"
              size="small"
              onClick={() => onValuesChange(emptyValues)}
              sx={{ color: 'text.secondary' }}
            >
              Limpar filtros
            </Button>
          ) : undefined
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', mx: -2 }}>
          <Box sx={{ borderRight: 1, borderColor: 'divider' }}>
            {leftGroups.map((g) =>
              g.type === 'checkbox' ? (
                <Box key={g.key}>
                  <CheckboxGroupSection
                    group={g}
                    values={values}
                    onValuesChange={onValuesChange}
                  />
                  <Divider />
                </Box>
              ) : null,
            )}
          </Box>
          <Box>
            {rightGroups.map((g) =>
              g.type === 'checkbox' ? (
                <Box key={g.key}>
                  <CheckboxGroupSection
                    group={g}
                    values={values}
                    onValuesChange={onValuesChange}
                  />
                  <Divider />
                </Box>
              ) : null,
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
