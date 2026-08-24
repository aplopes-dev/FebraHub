'use client';

import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { FaqFeedbackVote } from '../data/faq-feedback';

type HelpFaqFeedbackProps = {
  questionId: string;
  vote: FaqFeedbackVote | undefined;
  onVote: (vote: FaqFeedbackVote) => void;
};

export function HelpFaqFeedback({
  questionId,
  vote,
  onVote,
}: HelpFaqFeedbackProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', pt: 1.5, mt: 0.5 }}
    >
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
        Esta resposta foi útil?
      </Typography>
      <VoteButton
        label="Sim, foi útil"
        selected={vote === 'up'}
        onClick={() => onVote('up')}
        questionId={questionId}
        kind="up"
      />
      <VoteButton
        label="Não foi útil"
        selected={vote === 'down'}
        onClick={() => onVote('down')}
        questionId={questionId}
        kind="down"
      />
    </Stack>
  );
}

function VoteButton({
  label,
  selected,
  onClick,
  questionId,
  kind,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  questionId: string;
  kind: FaqFeedbackVote;
}) {
  const Icon = kind === 'up' ? ThumbUpOutlinedIcon : ThumbDownOutlinedIcon;
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      aria-pressed={selected}
      data-faq-id={questionId}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: '10px',
        cursor: 'pointer',
        bgcolor: selected ? 'primary.main' : 'transparent',
        color: selected ? 'primary.contrastText' : 'text.secondary',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
        '&:hover': {
          bgcolor: selected ? 'primary.dark' : 'secondary.main',
          color: selected ? 'primary.contrastText' : 'text.primary',
        },
      }}
    >
      <Icon sx={{ fontSize: 16 }} />
    </Box>
  );
}
