'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Icon } from '@citybox/mui/icons';
import type { IconProps } from '@citybox/mui/icons';
import {
  STORE_PERMISSIONS_MODULES,
  type Permission,
  type PermissionModule,
} from '@citybox/beautiful-permissions';

/** Mapa de ícones por module.id — usa nomes semânticos do @citybox/mui Icon. */
const MODULE_ICONS: Record<string, IconProps['name']> = {
  schedule: 'calendar',
  clients: 'customers',
  services: 'tag',
  stock: 'products',
  settings: 'settings',
  financial: 'wallet',
};

function comparePtLabel(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

function sortPermissionsByLabel(
  permissions: readonly Permission[],
): Permission[] {
  return [...permissions].sort((a, b) => comparePtLabel(a.label, b.label));
}

function sortModulesAlphabetically(
  modules: readonly PermissionModule[],
): PermissionModule[] {
  return [...modules]
    .map((module) => ({
      ...module,
      permissions: sortPermissionsByLabel(module.permissions),
    }))
    .sort((a, b) => comparePtLabel(a.name, b.name));
}

type MemberPermissionsPanelProps = {
  permissionValues: Record<string, boolean>;
  disabled?: boolean;
  onToggle: (permissionId: string, granted: boolean) => void;
  onToggleModule: (module: PermissionModule, granted: boolean) => void;
};

function countSelected(
  module: PermissionModule,
  values: Record<string, boolean>,
): number {
  return module.permissions.filter((p) => values[p.id]).length;
}

export function MemberPermissionsPanel({
  permissionValues,
  disabled = false,
  onToggle,
  onToggleModule,
}: MemberPermissionsPanelProps) {
  const modules = useMemo(
    () => sortModulesAlphabetically(STORE_PERMISSIONS_MODULES),
    [],
  );

  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        O papel define o conjunto inicial. Você pode marcar ou desmarcar
        permissões individualmente antes de salvar.
      </Typography>

      <Stack spacing={1.5}>
        {modules.map((module) => {
          const iconName = MODULE_ICONS[module.id] ?? 'settings';
          const selectedCount = countSelected(module, permissionValues);
          const totalCount = module.permissions.length;
          const allSelected = selectedCount === totalCount && totalCount > 0;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <Accordion
              key={module.id}
              disableGutters
              elevation={0}
              expanded={expanded === module.id}
              onChange={handleAccordionChange(module.id)}
              sx={{
                border: 'none',
                borderRadius: 3,
                bgcolor: 'action.hover',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 3,
                  px: 2,
                  py: 0.5,
                  minHeight: 48,
                  '&.Mui-expanded': { minHeight: 48 },
                  '& .MuiAccordionSummary-content': {
                    my: 1,
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <Icon
                  name={iconName}
                  size={18}
                  color="inherit"
                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {module.name} ({selectedCount}/{totalCount})
                </Typography>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2, pt: 0.5, pb: 2 }}>
                <Stack spacing={0.75}>
                  {module.permissions.map((permission) => {
                    const inputId = `permission-${permission.id}`;

                    return (
                      <Stack
                        key={permission.id}
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Checkbox
                          id={inputId}
                          size="small"
                          checked={permissionValues[permission.id] === true}
                          disabled={disabled}
                          onChange={(_, checked) =>
                            onToggle(permission.id, checked)
                          }
                          sx={{ p: 0.5 }}
                        />
                        <Typography
                          component="label"
                          htmlFor={inputId}
                          variant="body2"
                          sx={{ cursor: disabled ? 'default' : 'pointer' }}
                        >
                          {permission.label}
                        </Typography>
                      </Stack>
                    );
                  })}

                  {/* ── Toggle all — alinhado à direita, com separador ── */}
                  <Divider sx={{ mt: 1 }} />
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pt: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </Typography>
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={someSelected}
                      disabled={disabled || totalCount === 0}
                      onChange={(_, checked) =>
                        onToggleModule(module, checked)
                      }
                      sx={{ p: 0.5 }}
                    />
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Stack>
  );
}
