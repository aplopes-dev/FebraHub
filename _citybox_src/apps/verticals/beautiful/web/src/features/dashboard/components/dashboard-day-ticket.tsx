'use client';

import { alpha } from '@mui/material/styles';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Icon, type IconName } from '@citybox/mui/icons';

type TicketCellTone = 'primary' | 'warning' | 'success';

type TicketCell = {
  label: string;
  value: string;
  subtitle: string;
  icon: IconName;
  tone: TicketCellTone;
  compactValue?: boolean;
};

type DashboardDayTicketProps = {
  ticketDate: string;
  cells: TicketCell[];
};

export function DashboardDayTicket({ ticketDate, cells }: DashboardDayTicketProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        mb: 4.25,
        pb: '11px',
        overflow: 'visible',
      }}
    >
      <Box
        sx={(theme) => ({
          position: 'relative',
          bgcolor: 'background.paper',
          backgroundImage:
            theme.palette.mode === 'dark'
              ? 'none'
              : `linear-gradient(180deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.35)})`,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.18),
          borderRadius: 2.5,
          boxShadow:
            theme.palette.mode === 'dark'
              ? 'none'
              : `0 1px 2px ${theme.palette.action.hover}, 0 8px 24px -12px ${theme.palette.primary.dark}24`,
          pt: 3.25,
          pb: 2.75,
          px: 1,
          overflow: 'hidden',
        })}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'baseline',
            justifyContent: 'space-between',
            px: 3.5,
            pb: 2.25,
            mb: 0.75,
            borderBottom: '1px dashed',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.22),
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              Painel do dia
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 600 }}>
              Resumo de hoje
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}
          >
            {ticketDate}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}
        >
          {cells.map((cell) => (
            <TicketMetricCell key={cell.label} cell={cell} />
          ))}
        </Box>
      </Box>

      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 22,
          pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle at 11px 0, transparent 11px, ${theme.palette.background.default} 11.5px)`,
          backgroundSize: '22px 22px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: '8px 0',
        })}
      />
    </Box>
  );
}

function TicketMetricCell({ cell }: { cell: TicketCell }) {
  return (
    <Box
      sx={(theme) => ({
        px: 3.5,
        py: 2,
        position: 'relative',
        '& + &': {
          borderLeft: { xs: 'none', md: `1px dashed ${alpha(theme.palette.primary.main, 0.22)}` },
        },
        '&:nth-of-type(odd)': {
          borderRight: {
            xs: `1px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
            md: 'none',
          },
        },
        '&:nth-of-type(-n+2)': {
          borderBottom: {
            xs: `1px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
            md: 'none',
          },
        },
      })}
    >
      <Stack direction="row" spacing={0.9} sx={{ alignItems: 'center', mb: 1.25 }}>
        <Box
          sx={(theme) => ({
            width: 22,
            height: 22,
            borderRadius: 0.9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: alpha(theme.palette[cell.tone].main, 0.14),
            color: `${cell.tone}.main`,
          })}
        >
          <Icon name={cell.icon} size={13} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
          {cell.label}
        </Typography>
      </Stack>
      <Typography
        variant={cell.compactValue ? 'h6' : 'h4'}
        sx={{
          fontWeight: 600,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          fontSize: cell.compactValue ? 19 : 27,
        }}
      >
        {cell.value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.75, fontSize: 12, opacity: 0.85 }}
      >
        {cell.subtitle}
      </Typography>
    </Box>
  );
}
