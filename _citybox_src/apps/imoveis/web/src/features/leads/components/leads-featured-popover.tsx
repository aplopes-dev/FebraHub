'use client';

import { useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Box, Button, Popover } from '@citybox/mui/atoms';
import { primarySoftSurface } from '@/theme/accent-styles';
import { listifyShadows } from '@/theme/tokens';
import { LeadsFeaturedPropertyCard } from './leads-featured-property-card';

export function LeadsFeaturedPopover() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        startIcon={<AutoAwesomeIcon fontSize="small" />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          flex: { xs: 1, sm: '0 0 auto' },
          minWidth: 0,
          borderRadius: { xs: '14px', sm: undefined },
          textTransform: 'none',
          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
          whiteSpace: 'nowrap',
        }}
      >
        Recomendações
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 1,
              maxHeight: 'min(85vh, 40rem)',
              width: 'min(100vw - 2rem, 22rem)',
              overflowY: 'auto',
              p: 0,
              borderRadius: '24px',
              border: 0,
              bgcolor: primarySoftSurface(theme),
              boxShadow: listifyShadows.md,
            }),
          },
        }}
      >
        <Box>
          <LeadsFeaturedPropertyCard className="rounded-none border-0 shadow-none" />
        </Box>
      </Popover>
    </>
  );
}
