'use client';

import { Box, Typography } from '@citybox/mui/atoms';

type SlotOverflowLabelProps = {
  hiddenCount: number;
  onToggle: () => void;
  className?: string;
  variant?: 'timeline' | 'month';
};

/** Linha "+N mais" — clique abre a lista completa (sheet do dia ou do horário). */
export function SlotOverflowLabel({
  hiddenCount,
  onToggle,
  className,
  variant = 'timeline',
}: SlotOverflowLabelProps) {
  if (hiddenCount <= 0) return null;

  return (
    <Box
      component="button"
      type="button"
      className={className}
      aria-label={`Ver todos: +${hiddenCount} compromisso${hiddenCount === 1 ? '' : 's'}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: variant === 'month' ? 'flex-start' : 'center',
        width: '100%',
        height: '100%',
        minHeight: variant === 'month' ? 20 : 0,
        flexShrink: 0,
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'left',
        color: 'primary.main',
        fontWeight: 500,
        px: variant === 'timeline' ? 1 : 1,
        py: variant === 'month' ? 0.375 : 0,
        '&:hover': { color: 'primary.dark' },
      }}
    >
      <Typography
        component="span"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: variant === 'timeline' ? 11 : 10,
          fontWeight: 600,
          lineHeight: variant === 'timeline' ? 1.2 : '16px',
          color: 'inherit',
        }}
      >
        +{hiddenCount} mais
      </Typography>
    </Box>
  );
}
