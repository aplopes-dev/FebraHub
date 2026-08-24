'use client';

import { useEffect, useMemo, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { EmptyState, toast } from '@citybox/mui/molecules';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  HELP_FAQ_CATEGORY_LABEL,
  HELP_FAQ_CATEGORY_ORDER,
  HELP_FAQ_CATEGORY_SHORT_LABEL,
  type HelpFaqCategoryFilter,
  type HelpFaqItem,
} from '../data/faq-data';
import { filterFaqs } from '../data/help-search';
import {
  FAQ_FEEDBACK_STORAGE_KEY,
  parseFaqFeedbackMap,
  withFaqFeedbackVote,
  type FaqFeedbackVote,
} from '../data/faq-feedback';
import { HelpFaqAnswer } from './help-faq-answer';
import { HelpFaqFeedback } from './help-faq-feedback';

const CATEGORY_FILTERS: readonly {
  id: HelpFaqCategoryFilter;
  label: string;
  shortLabel: string;
}[] = [
  { id: 'all', label: 'Todos', shortLabel: 'Todos' },
  ...HELP_FAQ_CATEGORY_ORDER.map((id) => ({
    id,
    label: HELP_FAQ_CATEGORY_LABEL[id],
    shortLabel: HELP_FAQ_CATEGORY_SHORT_LABEL[id],
  })),
];

type HelpFaqProps = {
  items: readonly HelpFaqItem[];
  query: string;
  searchActive?: boolean;
  onOpenTicket: () => void;
};

export function HelpFaq({
  items,
  query,
  searchActive = false,
  onOpenTicket,
}: HelpFaqProps) {
  const [category, setCategory] = useState<HelpFaqCategoryFilter>('all');
  const [votes, setVotes] = useState<Record<string, FaqFeedbackVote>>({});

  useEffect(() => {
    try {
      setVotes(parseFaqFeedbackMap(sessionStorage.getItem(FAQ_FEEDBACK_STORAGE_KEY)));
    } catch {
      setVotes({});
    }
  }, []);

  useEffect(() => {
    setCategory('all');
  }, [query]);

  const visible = useMemo(
    () => filterFaqs(items, { query, category }),
    [category, items, query],
  );
  const pagination = useClientListPagination(
    visible,
    `${category}:${query.trim()}`,
  );

  function handleVote(id: string, vote: FaqFeedbackVote) {
    setVotes((current) => {
      const next = withFaqFeedbackVote(current, id, vote);
      try {
        sessionStorage.setItem(FAQ_FEEDBACK_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Persistência é opcional (modo privado / cota).
      }
      return next;
    });
    toast.success(
      vote === 'up' ? 'Obrigado pelo feedback' : 'Vamos melhorar essa resposta',
    );
  }

  return (
    <Box
      component="section"
      aria-labelledby="help-faq-heading"
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Box>
          <Typography
            id="help-faq-heading"
            component="h2"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Perguntas frequentes
          </Typography>
          {searchActive ? (
            <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: 'text.secondary' }}>
              {visible.length} resultado{visible.length === 1 ? '' : 's'} para “{query.trim()}”
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        role="group"
        aria-label="Categorias do FAQ"
        sx={{
          flexWrap: 'wrap',
          mb: 1.5,
        }}
      >
        {CATEGORY_FILTERS.map((filter) => {
          const selected = category === filter.id;
          return (
            <Box
              key={filter.id}
              component="button"
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(filter.id)}
              sx={(theme) => ({
                border: 0,
                cursor: 'pointer',
                px: 1.5,
                py: 0.75,
                borderRadius: '999px',
                fontFamily: 'inherit',
                fontSize: '0.8125rem',
                fontWeight: 500,
                lineHeight: 1.4,
                transition: 'background-color 0.15s, color 0.15s',
                ...(selected
                  ? {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }
                  : {
                      bgcolor: listifyElevatedSurface(theme),
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'secondary.main',
                        color: 'text.primary',
                      },
                    }),
              })}
            >
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                {filter.shortLabel}
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                {filter.label}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {visible.length === 0 ? (
        <EmptyState
          icon={<HelpOutlineOutlinedIcon sx={{ fontSize: 36 }} />}
          title="Nenhuma pergunta encontrada"
          description={
            searchActive
              ? `Não achamos um artigo para “${query.trim()}”. Abra um chamado que o time responde com o passo a passo.`
              : 'Não há perguntas nesta categoria. Veja Todas ou fale com o suporte.'
          }
          action={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {category !== 'all' ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setCategory('all')}
                  sx={{ textTransform: 'none', borderRadius: '12px' }}
                >
                  Ver todas
                </Button>
              ) : null}
              <Button
                variant="contained"
                color="primary"
                onClick={onOpenTicket}
                sx={{ textTransform: 'none', borderRadius: '12px' }}
              >
                Abrir ticket de suporte
              </Button>
            </Stack>
          }
          sx={{
            py: 5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '20px',
            bgcolor: 'background.paper',
          }}
        />
      ) : (
        <Stack spacing={1}>
          {pagination.pageItems.map((item) => (
            <Accordion
              key={item.id}
              disableGutters
              elevation={0}
              slotProps={{ transition: { timeout: 220 } }}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px !important',
                bgcolor: 'background.paper',
                '&:before': { display: 'none' },
                overflow: 'hidden',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  transition: 'transform 0.2s ease',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${item.id}-content`}
                id={`${item.id}-header`}
                sx={{
                  minHeight: 52,
                  px: 2,
                  '& .MuiAccordionSummary-content': { my: 1.25 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem', pr: 1 }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                <HelpFaqAnswer item={item} />
                <HelpFaqFeedback
                  questionId={item.id}
                  vote={votes[item.id]}
                  onVote={(vote) => handleVote(item.id, vote)}
                />
              </AccordionDetails>
            </Accordion>
          ))}
          <ListifyPagination
            count={pagination.total}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={pagination.setPerPage}
            rowsPerPageOptions={pagination.perPageOptions}
          />
        </Stack>
      )}
    </Box>
  );
}
