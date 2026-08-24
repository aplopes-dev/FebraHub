import type { ReactNode } from 'react';
import ConstructionIcon from '@mui/icons-material/Construction';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import { Panel } from './panel';

type PagePlaceholderProps = {
  title: string;
  description: string;
  /** Itens já previstos para a tela — ajuda a alinhar o escopo antes de construir. */
  upcoming?: readonly string[];
  children?: ReactNode;
};

/** Casca temporária das telas que ainda não foram implementadas. */
export function PagePlaceholder({
  title,
  description,
  upcoming,
  children,
}: PagePlaceholderProps) {
  return (
    <Stack spacing={2}>
      <Box component="header">
        <Typography
          component="h1"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Panel
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 8,
          textAlign: 'center',
        }}
      >
        <StatIconBadge icon={ConstructionIcon} size="md" circular />
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 500, mb: 0.5 }}>
            Tela em construção
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 448, mx: 'auto' }}
          >
            Ainda não implementamos esta etapa. O layout e os dados chegam nas próximas
            entregas.
          </Typography>
        </Box>

        {upcoming && upcoming.length > 0 && (
          <Stack
            component="ul"
            direction="row"
            useFlexGap
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
              listStyle: 'none',
              m: 0,
              p: 0,
              pt: 1,
            }}
          >
            {upcoming.map((item) => (
              <Box
                component="li"
                key={item}
                sx={{
                  borderRadius: 999,
                  bgcolor: 'secondary.main',
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        {children}
      </Panel>
    </Stack>
  );
}
