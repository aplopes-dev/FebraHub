'use client';

import { Avatar, Box, Checkbox, Skeleton, Stack, Typography } from '@citybox/mui/atoms';
import { useAssignableLeadAgents } from '@/features/settings/hooks/use-team-members-by-permission';
import { warningSoftSurface } from '@/theme/accent-styles';

type LeadAgentsFieldProps = {
  agentIds: readonly string[];
  onChange: (agentIds: string[]) => void;
};

export function LeadAgentsField({ agentIds, onChange }: LeadAgentsFieldProps) {
  const { members, isPending } = useAssignableLeadAgents();
  const selected = new Set(agentIds);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <Stack spacing={1.25}>
      <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 300 }}>
        Selecione um ou mais corretores que acompanham este lead.
      </Typography>

      {isPending ? (
        <Stack spacing={1}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={52} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      ) : members.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Nenhum corretor ativo com permissão de leads. Cadastre usuários em Configurações.
        </Typography>
      ) : (
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            alignItems: 'stretch',
            listStyle: 'none',
            m: 0,
            p: 0,
          }}
        >
          {members.map((agent) => {
            const checked = selected.has(agent.id);
            return (
              <Box component="li" key={agent.id}>
                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    cursor: 'pointer',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: '12px',
                    px: 1.5,
                    py: 1.25,
                    border: '1px solid',
                    borderColor: checked ? 'primary.light' : 'transparent',
                    bgcolor: checked
                      ? (theme) => warningSoftSurface(theme)
                      : 'secondary.light',
                    transition: 'background-color 0.15s, border-color 0.15s',
                    '&:hover': {
                      bgcolor: checked
                        ? (theme) => warningSoftSurface(theme)
                        : 'secondary.main',
                    },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => toggle(agent.id)}
                    size="small"
                    slotProps={{ input: { 'aria-label': `Designar ${agent.name}` } }}
                  />
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      fontSize: 12,
                      bgcolor: 'secondary.dark',
                    }}
                  >
                    {agent.initials}
                  </Avatar>
                  <Typography
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {agent.name}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
