'use client';

import Link from 'next/link';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { parseFaqAnswer } from '../data/faq-answer';
import type { HelpFaqItem } from '../data/faq-data';

type HelpFaqAnswerProps = {
  item: HelpFaqItem;
};

export function HelpFaqAnswer({ item }: HelpFaqAnswerProps) {
  const blocks = parseFaqAnswer(item.answer);

  return (
    <Stack spacing={1.25}>
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <Box
            key={`list-${index}`}
            component="ul"
            sx={{
              m: 0,
              pl: 2.25,
              color: 'text.secondary',
              fontSize: '0.875rem',
              lineHeight: 1.65,
            }}
          >
            {block.items.map((line, lineIndex) => (
              <Box component="li" key={`${item.id}-list-${index}-${lineIndex}`} sx={{ mb: 0.5 }}>
                {line}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            key={`p-${index}`}
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.65,
              color: 'text.secondary',
            }}
          >
            {block.text}
          </Typography>
        ),
      )}
      {item.links && item.links.length > 0 ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', pt: 0.5 }}>
          {item.links.map((link) => (
            <Box
              key={link.href}
              component={Link}
              href={link.href}
              sx={{
                display: 'inline-flex',
                px: 1.25,
                py: 0.5,
                borderRadius: '999px',
                border: '1px solid',
                borderColor: 'divider',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'text.primary',
                '&:hover': { bgcolor: 'secondary.main' },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
