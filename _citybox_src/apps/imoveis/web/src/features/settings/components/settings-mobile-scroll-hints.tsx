'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton } from '@citybox/mui/atoms';

type SettingsMobileScrollHintsProps = {
  canScrollStart: boolean;
  canScrollEnd: boolean;
  onScrollStart: () => void;
  onScrollEnd: () => void;
};

/**
 * Fade + setas nas bordas — só xs, quando o menu de chips/abas ainda tem itens fora da tela.
 */
export function SettingsMobileScrollHints({
  canScrollStart,
  canScrollEnd,
  onScrollStart,
  onScrollEnd,
}: SettingsMobileScrollHintsProps) {
  if (!canScrollStart && !canScrollEnd) return null;

  return (
    <>
      {canScrollStart ? (
        <EdgeHint side="start" onClick={onScrollStart} label="Seções anteriores" />
      ) : null}
      {canScrollEnd ? (
        <EdgeHint side="end" onClick={onScrollEnd} label="Mais seções" />
      ) : null}
    </>
  );
}

function EdgeHint({
  side,
  onClick,
  label,
}: {
  side: 'start' | 'end';
  onClick: () => void;
  label: string;
}) {
  const isEnd = side === 'end';

  return (
    <Box
      sx={(theme) => ({
        display: { xs: 'flex', sm: 'none' },
        position: 'absolute',
        top: 0,
        bottom: 0,
        [isEnd ? 'right' : 'left']: 0,
        zIndex: 1,
        width: 40,
        alignItems: 'center',
        justifyContent: isEnd ? 'flex-end' : 'flex-start',
        pointerEvents: 'none',
        background: `linear-gradient(to ${isEnd ? 'left' : 'right'}, ${theme.palette.background.paper} 18%, transparent)`,
      })}
    >
      <IconButton
        type="button"
        size="small"
        aria-label={label}
        onClick={onClick}
        sx={{
          pointerEvents: 'auto',
          width: 28,
          height: 28,
          mr: isEnd ? 0.25 : 0,
          ml: isEnd ? 0 : 0.25,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 2px rgba(16,24,40,0.12)',
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        {isEnd ? (
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        ) : (
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Box>
  );
}
