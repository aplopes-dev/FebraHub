'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography } from '@citybox/mui/atoms';
import { useCurrentClock } from '../hooks/use-current-clock';
import { pad2 } from '../utils/agenda-date';

type AgendaNowIndicatorProps = {
  firstVisibleHour: number;
  lastVisibleHour: number;
  hourHeight: number;
  gutterWidth?: number;
};

export function AgendaNowIndicator({
  firstVisibleHour,
  lastVisibleHour,
  hourHeight,
  gutterWidth = 56,
}: AgendaNowIndicatorProps) {
  const now = useCurrentClock();
  const lineRef = useRef<HTMLDivElement>(null);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const outsideRange = hours < firstVisibleHour || hours >= lastVisibleHour;

  const minutesFromStart = hours * 60 + minutes - firstVisibleHour * 60;
  const top = (minutesFromStart / 60) * hourHeight;
  const label = `${pad2(hours)}:${pad2(minutes)}`;

  useEffect(() => {
    if (outsideRange) return;
        lineRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [outsideRange]);

  if (outsideRange) return null;

  return (
    <Box
      ref={lineRef}
      aria-hidden
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        zIndex: 3,
        pointerEvents: 'none',
        borderTop: '2px solid',
        borderColor: 'primary.main',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: gutterWidth,
          top: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          left: 0,
          width: gutterWidth,
          top: 0,
          transform: 'translateY(-50%)',
          textAlign: 'center',
          color: 'primary.main',
          fontWeight: 700,
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          bgcolor: 'background.paper',
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
