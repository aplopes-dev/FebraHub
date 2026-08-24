'use client';

import { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { useCan } from '@/features/permissions';
import { SettingsShell } from '@/features/settings/components/settings-shell';
import {
  StoreWorkScheduleEditor,
  validateWeekSchedule,
} from '@/features/settings/components/store-work-schedule-editor';
import { WEEKDAY_IDS, type WeekSchedule } from '@/lib/work-schedule';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';
import {
  useReplaceStoreWorkScheduleMutation,
  useStoreWorkScheduleQuery,
} from '../hooks/use-settings-queries';

function isWeekDirty(current: WeekSchedule, baseline: WeekSchedule): boolean {
  return WEEKDAY_IDS.some(
    (day) => JSON.stringify(current[day]) !== JSON.stringify(baseline[day]),
  );
}

function ScheduleForm({ initialWeek }: { initialWeek: WeekSchedule }) {
  const canManageSettings = useCan('manage', 'Settings');
  const [week, setWeek] = useState<WeekSchedule>(initialWeek);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const replaceMutation = useReplaceStoreWorkScheduleMutation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeek(initialWeek);
  }, [initialWeek]);

  const handleChange = (next: WeekSchedule) => {
    setWeek(next);
    setValidationError(null);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    const error = validateWeekSchedule(week);
    if (error) {
      setValidationError(error);
      return;
    }

    replaceMutation.mutate(week, {
      onSuccess: () => {
        setSaveSuccess(true);
        toast.success('Horário salvo', {
          description: 'A grade de funcionamento do estabelecimento foi atualizada.',
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível salvar o horário. Tente novamente.';
        toast.error('Falha ao salvar horário', { description: message });
      },
    });
  };

  const formDisabled = replaceMutation.isPending || !canManageSettings;
  const isDirty = isWeekDirty(week, initialWeek);

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="fieldset"
        disabled={formDisabled}
        sx={{
          m: 0,
          p: 0,
          minWidth: 0,
          border: 0,
          opacity: formDisabled ? 0.6 : 1,
        }}
      >
        <Stack spacing={2.5}>
          {validationError ? (
            <Alert severity="error">{validationError}</Alert>
          ) : null}

          <StoreWorkScheduleEditor
            week={week}
            onChange={handleChange}
            disabled={formDisabled}
          />

          <Divider />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}
          >
            {saveSuccess ? (
              <Typography variant="body2" color="primary" role="status">
                Alterações salvas com sucesso.
              </Typography>
            ) : null}

            {canManageSettings ? (
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={formDisabled || !isDirty}
                startIcon={
                  replaceMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon name="check" size={18} />
                  )
                }
              >
                {replaceMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export function SettingsWorkSchedulePage() {
  const { data, isPending, isError, refetch } = useStoreWorkScheduleQuery();

  return (
    <SettingsShell>
      {isError ? (
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" variant="outlined" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar a grade de funcionamento.
          </Alert>
        </Box>
      ) : isPending && !data ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={settingsMutedTextSx}>Carregando horário de funcionamento…</Typography>
        </Paper>
      ) : data ? (
        <ScheduleForm initialWeek={data.week} />
      ) : null}
    </SettingsShell>
  );
}
