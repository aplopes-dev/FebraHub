'use client';

import type { ReactNode } from 'react';
import {
  Stack,
  Typography,
  Button,
  IconButton,
  Box,
  FormControl,
  Select,
  MenuItem,
  Avatar,
} from '@citybox/mui/atoms';
import { DatePicker } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import {
  AGENDA_VIEW_MODE_LABEL,
  type AgendaProfessional,
  type AgendaViewMode,
} from '../types/agenda.types';
import { parseIsoDate, toIsoDate } from '../utils/agenda-date';

export const AGENDA_ALL_PROFESSIONALS = 'all';

type AgendaToolbarProps = {
  viewMode: AgendaViewMode;
  onViewModeChange: (mode: AgendaViewMode) => void;
  cursorDate: string;
  onCursorDateChange: (date: string) => void;
  onNavigate: (direction: -1 | 1) => void;
  onToday: () => void;
  professionals: AgendaProfessional[];
  /** `'all'` ou id do profissional. */
  selectedProfessionalId: string;
  onProfessionalChange: (id: string) => void;
  action?: ReactNode;
};

const VIEW_OPTIONS: AgendaViewMode[] = ['day', 'week', 'month'];

export function AgendaToolbar({
  viewMode,
  onViewModeChange,
  cursorDate,
  onCursorDateChange,
  onNavigate,
  onToday,
  professionals,
  selectedProfessionalId,
  onProfessionalChange,
  action,
}: AgendaToolbarProps) {
  const activeProfessionals = professionals.filter((p) => p.active);

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={{ xs: 1.5, lg: 2 }}
      sx={{
        alignItems: { lg: 'center' },
        p: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Esquerda: filtro profissional */}
      <FormControl
        size="small"
        sx={{
          minWidth: 0,
          width: { xs: '100%', md: 192 },
          maxWidth: { lg: 220 },
          flexShrink: 0,
        }}
      >
        <Select
          value={selectedProfessionalId}
          onChange={(e) => onProfessionalChange(String(e.target.value))}
          displayEmpty
          aria-label="Filtrar profissional"
          renderValue={(value) => {
            if (value === AGENDA_ALL_PROFESSIONALS) {
              return (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Stack direction="row">
                    {activeProfessionals.slice(0, 2).map((p, i) => (
                      <Avatar
                        key={p.id}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 10,
                          bgcolor: p.color,
                          border: '2px solid',
                          borderColor: 'background.paper',
                          ml: i === 0 ? 0 : -0.75,
                        }}
                      >
                        {p.name.charAt(0)}
                      </Avatar>
                    ))}
                    {activeProfessionals.length > 2 ? (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'action.hover',
                          border: '2px solid',
                          borderColor: 'background.paper',
                          ml: -0.75,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        +{activeProfessionals.length - 2}
                      </Box>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" noWrap>
                    Todos
                  </Typography>
                </Stack>
              );
            }
            const pro = activeProfessionals.find((p) => p.id === value);
            if (!pro) return 'Profissional';
            return (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 10,
                    bgcolor: pro.color,
                  }}
                >
                  {pro.name.charAt(0)}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {pro.name.split(' ')[0]}
                </Typography>
              </Stack>
            );
          }}
        >
          <MenuItem value={AGENDA_ALL_PROFESSIONALS}>
            <Typography variant="body2">Todos os profissionais</Typography>
          </MenuItem>
          {activeProfessionals.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 10,
                    bgcolor: p.color,
                  }}
                >
                  {p.name.charAt(0)}
                </Avatar>
                <Typography variant="body2">{p.name}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/*
        Direita: Hoje · ◀▶ · DatePicker · Vista
        Mobile: wrap; lg+: alinhado à direita (igual clínica).
      */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          minWidth: 0,
          flex: 1,
          justifyContent: { lg: 'flex-end' },
        }}
      >
        <Button
          variant="text"
          size="small"
          onClick={onToday}
          sx={{ color: 'text.secondary', minWidth: 'auto', px: 1.25 }}
        >
          Hoje
        </Button>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={() => onNavigate(-1)}
            aria-label="Anterior"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Icon name="chevron-left" size={18} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onNavigate(1)}
            aria-label="Próximo"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Icon name="chevron-right" size={18} />
          </IconButton>
        </Stack>

        <Box sx={{ width: { xs: 152, sm: 160 }, flexShrink: 0 }}>
          <DatePicker
            label=""
            size="small"
            value={parseIsoDate(cursorDate)}
            onChange={(next) => {
              if (next) onCursorDateChange(toIsoDate(next));
            }}
            sx={{
              width: '100%',
              '& .MuiFormLabel-root': { display: 'none' },
              '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
            }}
          />
        </Box>

        <FormControl
          size="small"
          sx={{ width: { xs: 120, sm: 128 }, flexShrink: 0 }}
        >
          <Select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as AgendaViewMode)}
            aria-label="Visualização"
          >
            {VIEW_OPTIONS.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {AGENDA_VIEW_MODE_LABEL[mode]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
    </Stack>
  );
}
