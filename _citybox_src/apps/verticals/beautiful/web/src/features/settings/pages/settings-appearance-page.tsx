'use client';

import { useTheme } from 'next-themes';
import { Alert, Box, Grid, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { useCan } from '@/features/permissions';
import { ThemePresetCard } from '@/features/settings/components/theme-preset-card';
import { SettingsShell } from '@/features/settings/components/settings-shell';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';
import { THEME_PRESET_LIST } from '@/theme/theme-presets';
import { useStoreTheme } from '@/theme/theme-store-context';

export function SettingsAppearancePage() {
  const canManageSettings = useCan('manage', 'Settings');
  const { resolvedTheme } = useTheme();
  const { themeId, selectTheme, isSaving } = useStoreTheme();
  const defaultPreviewDark = resolvedTheme === 'dark';

  return (
    <SettingsShell
    >
      <Grid container spacing={2}>
        {THEME_PRESET_LIST.map((preset) => (
          <Grid key={preset.id} size={{ xs: 12, sm: 6, lg: 3 }}>
            <ThemePresetCard
              preset={preset}
              active={preset.id === themeId}
              disabled={isSaving || !canManageSettings}
              defaultPreviewDark={defaultPreviewDark}
              onSelect={() => {
                if (!canManageSettings || preset.id === themeId) return;
                selectTheme(preset.id);
                toast.success('Tema aplicado', {
                  description: `${preset.name} está ativo neste estabelecimento.`,
                });
              }}
            />
          </Grid>
        ))}
      </Grid>
    </SettingsShell>
  );
}
