'use client';

import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
} from '@citybox/mui/atoms';

const PLACEHOLDER_COUNT = 6;

export function MemberGridSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(4, 1fr)',
        },
      }}
      aria-busy
      aria-label="Carregando equipe"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <Card
          key={index}
          variant="outlined"
          aria-hidden
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardHeader
            avatar={<Skeleton variant="circular" width={44} height={44} />}
            title={<Skeleton variant="rounded" width={128} height={16} />}
            subheader={<Skeleton variant="rounded" width={160} height={12} sx={{ mt: 1 }} />}
            sx={{ bgcolor: 'action.hover' }}
          />
          <CardContent>
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" width="66%" height={14} />
              <Skeleton variant="rounded" width="50%" height={14} />
              <Skeleton variant="rounded" width={112} height={20} />
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Skeleton variant="rounded" height={36} sx={{ width: '100%' }} />
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}
