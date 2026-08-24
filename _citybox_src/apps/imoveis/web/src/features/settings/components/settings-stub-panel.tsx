'use client';

import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';

type SettingsStubPanelProps = {
  title: string;
  description: string;
};

export function SettingsStubPanel({ title, description }: SettingsStubPanelProps) {
  return (
    <Panel className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
      <Box
        className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"
        sx={{ display: 'inline-flex' }}
      >
        <ConstructionOutlinedIcon sx={{ fontSize: 20 }} />
      </Box>
      <Stack spacing={0.5}>
        <Typography component="h2" variant="h6" className="tracking-tight">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="max-w-sm">
          {description}
        </Typography>
      </Stack>
    </Panel>
  );
}
