'use client';

import { useMemo, useState } from 'react';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { Box, Button, Input, Stack, Typography } from '@citybox/mui/atoms';
import type { Theme } from '@mui/material/styles';
import {
  primarySoftSurface,
  warningSoftSurface,
} from '@/theme/accent-styles';
import type { LeadActivity, LeadActivityType } from '../types';
import { leadTabMultilineSx } from './lead-form-tab-styles';

type LeadActivityTabProps = {
  activities: readonly LeadActivity[];
  onChange: (next: LeadActivity[]) => void;
};

const TYPE_ICON: Record<LeadActivityType, SvgIconComponent> = {
  note: NotesOutlinedIcon,
  system: SyncOutlinedIcon,
  status: SyncOutlinedIcon,
  assignment: PersonAddOutlinedIcon,
  document: DescriptionOutlinedIcon,
  property: HomeOutlinedIcon,
};

function getActivityIconStyle(theme: Theme, type: LeadActivityType) {
  switch (type) {
    case 'note':
      return {
        bgcolor: warningSoftSurface(theme),
        color: theme.palette.primary.main,
      };
    case 'assignment':
    case 'property':
      return {
        bgcolor: primarySoftSurface(theme),
        color: theme.palette.primary.main,
      };
    case 'document':
      return {
        bgcolor: warningSoftSurface(theme),
        color: theme.palette.warning.dark,
      };
    case 'system':
    case 'status':
    default:
      return {
        bgcolor: theme.palette.secondary.main,
        color: theme.palette.text.secondary,
      };
  }
}

export function LeadActivityTab({ activities, onChange }: LeadActivityTabProps) {
  const [note, setNote] = useState('');

  const sorted = useMemo(
    () =>
      [...activities].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [activities],
  );

  function handleAddNote() {
    const message = note.trim();
    if (!message) return;
    const entry: LeadActivity = {
      id: `lact-${crypto.randomUUID()}`,
      type: 'note',
      message,
      createdAt: new Date().toISOString(),
      authorName: 'Você',
    };
    onChange([entry, ...activities]);
    setNote('');
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Typography
          sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Adicionar nota
        </Typography>
        <Input
          multiline
          minRows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              handleAddNote();
            }
          }}
          placeholder="Registrar contato, observação ou próximo passo…"
          fullWidth
          sx={leadTabMultilineSx}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 300, display: { xs: 'none', sm: 'block' } }}
          >
            Ctrl/⌘ + Enter para enviar
          </Typography>
          <Button
            type="button"
            variant="contained"
            startIcon={<ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={handleAddNote}
            disabled={!note.trim()}
            sx={{
              height: 44,
              borderRadius: '12px',
              px: 2.5,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              ml: 'auto',
            }}
          >
            Adicionar nota
          </Button>
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        <Typography
          sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Histórico
        </Typography>

        {sorted.length === 0 ? (
          <Stack
            spacing={1}
            sx={{
              alignItems: 'center',
              borderRadius: '16px',
              bgcolor: 'secondary.light',
              px: 3,
              py: 5,
              textAlign: 'center',
            }}
          >
            <NotesOutlinedIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
              Nenhuma atividade ainda
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: '0.8125rem', fontWeight: 300, maxWidth: 300 }}
            >
              Notas, mudanças de status e vínculos aparecem aqui.
            </Typography>
          </Stack>
        ) : (
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, position: 'relative' }}>
            {sorted.map((item, index) => {
              const Icon = TYPE_ICON[item.type];
              const isLast = index === sorted.length - 1;

              return (
                <Box
                  component="li"
                  key={item.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    position: 'relative',
                    pb: isLast ? 0 : 2,
                  }}
                >
                  {!isLast ? (
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        left: 19,
                        top: 40,
                        bottom: 0,
                        width: 2,
                        bgcolor: 'secondary.dark',
                      }}
                    />
                  ) : null}

                  <Box
                    sx={(theme) => ({
                      position: 'relative',
                      zIndex: 1,
                      display: 'inline-flex',
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      ...getActivityIconStyle(theme, item.type),
                    })}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      borderRadius: '16px',
                      bgcolor: 'secondary.light',
                      px: 1.75,
                      py: 1.5,
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.45 }}
                    >
                      {item.message}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem', fontWeight: 300, mt: 0.5 }}
                    >
                      {formatActivityWhen(item.createdAt)}
                      {item.authorName ? ` · ${item.authorName}` : ''}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

function formatActivityWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
