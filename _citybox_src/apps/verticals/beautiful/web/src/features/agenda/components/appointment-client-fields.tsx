'use client';

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { FormField } from '@citybox/mui/molecules';
import { formatPhoneBR } from '@/lib/field-masks';
import type { AgendaClientOption, AppointmentClientMode } from '../types/agenda.types';

type AppointmentClientFieldsProps = {
  mode: AppointmentClientMode;
  onModeChange: (mode: AppointmentClientMode) => void;
  clients: AgendaClientOption[];
  clientId: string;
  onClientIdChange: (id: string) => void;
  newClientName: string;
  onNewClientNameChange: (name: string) => void;
  newClientPhone: string;
  onNewClientPhoneChange: (phone: string) => void;
  errors: {
    clientId?: string;
    newClientName?: string;
    newClientPhone?: string;
  };
};

export function AppointmentClientFields({
  mode,
  onModeChange,
  clients,
  clientId,
  onClientIdChange,
  newClientName,
  onNewClientNameChange,
  newClientPhone,
  onNewClientPhoneChange,
  errors,
}: AppointmentClientFieldsProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: 'wrap', alignItems: 'center' }}
      >
        <Button
          size="small"
          variant={mode === 'existing' ? 'contained' : 'outlined'}
          color={mode === 'existing' ? 'primary' : 'inherit'}
          onClick={() => onModeChange('existing')}
        >
          Cliente cadastrado
        </Button>
        <Button
          size="small"
          variant={mode === 'new' ? 'contained' : 'outlined'}
          color={mode === 'new' ? 'primary' : 'inherit'}
          onClick={() => onModeChange('new')}
        >
          Novo cliente
        </Button>
      </Stack>

      {mode === 'existing' ? (
        <FormControl fullWidth error={Boolean(errors.clientId)}>
          <InputLabel id="agenda-client-label">Cliente *</InputLabel>
          <Select
            labelId="agenda-client-label"
            label="Cliente *"
            value={clientId}
            onChange={(e) => onClientIdChange(String(e.target.value))}
          >
            {clients.length === 0 ? (
              <MenuItem disabled value="">
                Nenhum cliente cadastrado
              </MenuItem>
            ) : (
              clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </MenuItem>
              ))
            )}
          </Select>
          {errors.clientId ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.clientId}
            </Typography>
          ) : clients.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Use &quot;Novo cliente&quot; para cadastrar na hora.
            </Typography>
          ) : null}
        </FormControl>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <FormField
            label="Nome *"
            placeholder="Ex: Maria Souza"
            value={newClientName}
            onChange={(e) => onNewClientNameChange(e.target.value)}
            error={Boolean(errors.newClientName)}
            helperText={errors.newClientName}
            fullWidth
          />
          <FormField
            label="Telefone / WhatsApp *"
            placeholder="(73) 99999-9999"
            value={newClientPhone}
            onChange={(e) =>
              onNewClientPhoneChange(formatPhoneBR(e.target.value))
            }
            error={Boolean(errors.newClientPhone)}
            helperText={errors.newClientPhone}
            fullWidth
          />
        </Box>
      )}
    </Stack>
  );
}
