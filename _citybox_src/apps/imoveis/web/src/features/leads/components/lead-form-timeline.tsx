'use client';

import Link from 'next/link';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import {
  primarySoftSurface,
  warningSoftSurface,
} from '@/theme/accent-styles';
import {
  PIPELINE_STEPS,
  pipelineStepLabel,
  resolvePipelineProgress,
} from '../utils/lead-pipeline';
import type { LeadStatus, ActiveDeal } from '../types';

type LeadFormTimelineProps = {
  status: LeadStatus;
  hasMatchedProperty: boolean;
  activeDeal?: ActiveDeal | null;
  latestFollowUp?: string;
  nextFollowUp?: string;
  onLinkProperty?: () => void;
  onSendContract?: () => void;
  onCreateTransaction?: () => void;
};

export function LeadFormTimeline({
  status,
  hasMatchedProperty,
  activeDeal,
  latestFollowUp,
  nextFollowUp,
  onLinkProperty,
  onSendContract,
  onCreateTransaction,
}: LeadFormTimelineProps) {
  if (status === 'cancelled') {
    return (
      <Box
        sx={{
          borderRadius: '12px',
          bgcolor: 'secondary.main',
          px: 1.5,
          py: 1.5,
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'error.main' }}>
          Lead cancelado
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 300, mt: 0.5 }}>
          O funil de fechamento não se aplica a este status.
        </Typography>
      </Box>
    );
  }

  const done = resolvePipelineProgress(
    status,
    hasMatchedProperty,
    activeDeal?.stage,
    activeDeal?.status,
  );
  const timelineKey = `${status}-${activeDeal?.stage ?? 'none'}-${activeDeal?.status ?? 'none'}`;

  return (
    <Stack spacing={0} sx={{ position: 'relative', pl: 0.5 }} key={timelineKey}>
      {PIPELINE_STEPS.map((step, index) => {
        const isDone = index < done;
        const isCurrent = index === done;
        const isLast = index === PIPELINE_STEPS.length - 1;
        const label = pipelineStepLabel(step);
        const dateHint =
          isDone && latestFollowUp
            ? latestFollowUp
            : isCurrent && nextFollowUp
              ? nextFollowUp
              : undefined;

        return (
          <Stack
            key={step.id}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'flex-start', position: 'relative', pb: isLast ? 0 : 2.5 }}
          >
            {!isLast ? (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: 7,
                  top: 16,
                  bottom: 0,
                  width: 2,
                  bgcolor: isDone ? 'primary.main' : 'divider',
                }}
              />
            ) : null}

            <Box
              aria-hidden
              sx={{
                position: 'relative',
                zIndex: 1,
                width: 16,
                height: 16,
                mt: 0.25,
                flexShrink: 0,
                borderRadius: 999,
                bgcolor: isDone || isCurrent ? 'primary.main' : 'divider',
                boxShadow:
                  isCurrent && !isDone
                    ? (theme) => `0 0 0 4px ${warningSoftSurface(theme, 0.35)}`
                    : 'none',
              }}
            />

            <Box sx={{ minWidth: 0, flex: 1, pt: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: isDone || isCurrent ? 'text.primary' : 'text.secondary',
                }}
              >
                {label}
              </Typography>
              {dateHint ? (
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 300, mt: 0.25 }}
                >
                  {dateHint}
                </Typography>
              ) : null}
              {isDone && step.id !== 'property_selected' ? (
                <Box
                  component={Link}
                  href="#contact"
                  sx={{
                    display: 'inline-block',
                    mt: 0.25,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Ver detalhe
                </Box>
              ) : null}
              {(isCurrent || isDone) &&
              step.id === 'property_selected' &&
              hasMatchedProperty &&
              onSendContract ? (
                <Box
                  component="button"
                  type="button"
                  onClick={onSendContract}
                  sx={{
                    display: 'inline-block',
                    mt: 0.25,
                    border: 0,
                    bgcolor: 'transparent',
                    p: 0,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Enviar contrato
                </Box>
              ) : null}
              {isCurrent && step.id === 'contract_signed' && onCreateTransaction ? (
                <Box
                  component="button"
                  type="button"
                  onClick={onCreateTransaction}
                  sx={{
                    display: 'inline-block',
                    mt: 0.25,
                    border: 0,
                    bgcolor: 'transparent',
                    p: 0,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Criar transação
                </Box>
              ) : null}
              {isCurrent && step.id === 'awaiting_property' && !hasMatchedProperty ? (
                <Box
                  component="button"
                  type="button"
                  onClick={onLinkProperty}
                  sx={{
                    display: 'inline-block',
                    mt: 0.25,
                    border: 0,
                    bgcolor: 'transparent',
                    p: 0,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    cursor: onLinkProperty ? 'pointer' : 'default',
                    textDecoration: 'none',
                    '&:hover': onLinkProperty ? { textDecoration: 'underline' } : undefined,
                  }}
                >
                  Vincular imóvel
                </Box>
              ) : null}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
