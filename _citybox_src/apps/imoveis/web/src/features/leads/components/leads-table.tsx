'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import HandshakeIcon from '@mui/icons-material/Handshake';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@citybox/mui/atoms';
import type { Theme } from '@mui/material/styles';
import { Panel } from '@/components/ui/panel';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import type { ContactLeadDetail } from '../types';
import { LeadStatusBadge } from './lead-status-badge';

type LeadsTableProps = {
  leads: readonly ContactLeadDetail[];
  startIndex: number;
  onPromoteToTransaction?: (lead: ContactLeadDetail) => void;
};

const headerCellSx = {
  border: 0,
  pb: 1.5,
  px: { xs: 1, sm: 1.25, lg: 1.5 },
  pt: 0,
  bgcolor: 'transparent',
  color: 'text.secondary',
  fontSize: { xs: '0.8125rem', sm: '0.9375rem', lg: '1rem' },
  fontWeight: 500,
  lineHeight: 1.35,
  verticalAlign: 'bottom' as const,
  minWidth: 0,
  overflow: 'hidden',
};

const headerLabelSx = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  color: 'inherit',
};

const bodyCellSx = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  px: { xs: 1, sm: 1.5 },
  py: 0,
  height: { xs: 80, sm: 84 },
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  fontWeight: 500,
  lineHeight: 1.6,
  bgcolor: (theme: Theme) => listifyElevatedSurface(theme),
  minWidth: 0,
  overflow: 'hidden',
};

const LIST_ROW_RADIUS = '20px';

function listRowCornerSx(isFirst: boolean, isLast: boolean) {
  if (!isFirst && !isLast) return {};

  return {
    '& > td:nth-of-type(1)': {
      ...(isFirst
        ? { borderTopLeftRadius: { xs: 0, sm: LIST_ROW_RADIUS } }
        : {}),
      ...(isLast
        ? { borderBottomLeftRadius: { xs: 0, sm: LIST_ROW_RADIUS } }
        : {}),
    },
    // No xs a coluna Nº some (`display: none`); o 1º td visível é Nome.
    '& > td:nth-of-type(2)': {
      ...(isFirst
        ? { borderTopLeftRadius: { xs: LIST_ROW_RADIUS, sm: 0 } }
        : {}),
      ...(isLast
        ? { borderBottomLeftRadius: { xs: LIST_ROW_RADIUS, sm: 0 } }
        : {}),
    },
    '& > td:last-of-type': {
      ...(isFirst ? { borderTopRightRadius: LIST_ROW_RADIUS } : {}),
      ...(isLast ? { borderBottomRightRadius: LIST_ROW_RADIUS } : {}),
    },
    ...(isLast ? { '& > td': { borderBottom: 0 } } : {}),
  };
}

const actionColumnMinWidth = { xs: 48, sm: 72, md: 88 } as const;

const actionCellSx = {
  ...bodyCellSx,
  pr: { xs: 1, sm: 1.5 },
  pl: { xs: 0.5, sm: 1.5 },
  width: actionColumnMinWidth,
  minWidth: actionColumnMinWidth,
  maxWidth: actionColumnMinWidth,
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'middle' as const,
};

const statusCellSx = {
  ...bodyCellSx,
  width: { xs: 96, sm: 112, md: 128 },
  maxWidth: { xs: 96, sm: 112, md: 128 },
  px: { xs: 0.75, sm: 1.5 },
};

const ellipsisTextSx = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  fontSize: 'inherit',
  fontWeight: 'inherit',
};

export function LeadsTable({
  leads,
  startIndex,
  onPromoteToTransaction,
}: LeadsTableProps) {
  const router = useRouter();

  return (
    <Panel
      sx={{
        overflow: 'hidden',
        p: 0,
        bgcolor: 'transparent',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: { xs: 1.5, sm: 2.5 },
          pb: 1,
          px: 0.5,
          color: 'text.secondary',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        }}
      >
        {onPromoteToTransaction ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <HandshakeIcon sx={{ fontSize: 14, color: 'text.primary' }} />
            Promover para transação
          </Box>
        ) : null}
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <NorthEastIcon sx={{ fontSize: 14, color: 'text.primary' }} />
          Abrir lead
        </Box>
      </Box>
      <TableContainer
        sx={{
          width: '100%',
          maxWidth: '100%',
          // Sem scroll horizontal — a tabela cabe na viewport (mobile incluso).
          overflowX: 'hidden',
        }}
      >
        <Table
          sx={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
            maxWidth: '100%',
            tableLayout: 'fixed',
          }}
        >
          <TableHead>
            <TableRow sx={{ '&:hover': { bgcolor: 'transparent' } }}>
              <TableCell
                sx={{
                  ...headerCellSx,
                  width: 48,
                  pl: 1.5,
                  display: { xs: 'none', sm: 'table-cell' },
                }}
              >
                <Typography component="span" sx={headerLabelSx}>
                  Nº
                </Typography>
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: { xs: 'auto', lg: '32%' } }}>
                <Typography component="span" sx={headerLabelSx}>
                  Nome
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  ...headerCellSx,
                  width: { lg: '16%' },
                  display: { xs: 'none', md: 'table-cell' },
                }}
              >
                <Typography component="span" sx={headerLabelSx} title="Último contato">
                  Último contato
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  ...headerCellSx,
                  width: { lg: '12%' },
                  display: { xs: 'none', lg: 'table-cell' },
                }}
              >
                <Typography component="span" sx={headerLabelSx}>
                  Tipo
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  ...headerCellSx,
                  width: { lg: '16%' },
                  display: { xs: 'none', md: 'table-cell' },
                }}
              >
                <Typography component="span" sx={headerLabelSx}>
                  Orçamento
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  ...headerCellSx,
                  width: { xs: 96, sm: 112, md: 128 },
                  maxWidth: { xs: 96, sm: 112, md: 128 },
                  px: { xs: 0.75, sm: 1.25, lg: 1.5 },
                }}
              >
                <Typography component="span" sx={headerLabelSx}>
                  Status
                </Typography>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  ...headerCellSx,
                  width: actionColumnMinWidth,
                  maxWidth: actionColumnMinWidth,
                  pr: { xs: 1, sm: 1.5 },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    ...headerLabelSx,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Ação
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead, index) => {
              const isFirst = index === 0;
              const isLast = index === leads.length - 1;

              return (
                <TableRow
                  key={lead.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:hover > td': { bgcolor: 'secondary.light' },
                    ...listRowCornerSx(isFirst, isLast),
                  }}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <TableCell
                    sx={{
                      ...bodyCellSx,
                      pl: 1.5,
                      color: 'text.primary',
                      display: { xs: 'none', sm: 'table-cell' },
                    }}
                  >
                    {startIndex + index}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, width: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.25 }, minWidth: 0 }}>
                      <Avatar
                        src={lead.photoUrl || undefined}
                        sx={{
                          width: { xs: 36, sm: 48 },
                          height: { xs: 36, sm: 48 },
                          flexShrink: 0,
                          fontSize: { xs: '0.8125rem', sm: '1rem' },
                        }}
                      >
                        {lead.initials}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Link
                          href={`/leads/${lead.id}`}
                          onClick={(event) => event.stopPropagation()}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500,
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {lead.name}
                          </Typography>
                        </Link>
                        <Typography
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.6875rem', sm: '0.875rem' },
                            fontWeight: 300,
                            lineHeight: 1.45,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lead.intent}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{
                            display: { xs: 'block', md: 'none' },
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            lineHeight: 1.45,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lead.budgetLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...bodyCellSx,
                      display: { xs: 'none', md: 'table-cell' },
                    }}
                  >
                    <Typography component="span" sx={ellipsisTextSx}>
                      {lead.lastContactedAt || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...bodyCellSx,
                      display: { xs: 'none', lg: 'table-cell' },
                    }}
                  >
                    <Typography component="span" sx={ellipsisTextSx}>
                      {PROPERTY_TYPE_LABEL[lead.interestedPropertyType]}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...bodyCellSx,
                      display: { xs: 'none', md: 'table-cell' },
                    }}
                  >
                    <Typography component="span" sx={ellipsisTextSx}>
                      {lead.budgetLabel}
                    </Typography>
                  </TableCell>
                  <TableCell sx={statusCellSx}>
                    <Box
                      sx={{
                        minWidth: 0,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        '& .MuiTypography-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          lineHeight: { xs: 1.35, sm: 1.55 },
                        },
                        '& > span': {
                          px: { xs: 1, sm: 1.5 },
                          py: { xs: 0.25, sm: 0.5 },
                        },
                      }}
                    >
                      <LeadStatusBadge status={lead.status} className="max-w-full" />
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={actionCellSx}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        flexShrink: 0,
                        width: '100%',
                      }}
                    >
                      {onPromoteToTransaction ? (
                        <Tooltip title="Promover para transação">
                          <IconButton
                            size="small"
                            aria-label={`Promover ${lead.name} para transação`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onPromoteToTransaction(lead);
                            }}
                            sx={{
                              display: { xs: 'none', md: 'inline-flex' },
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              borderRadius: 999,
                              bgcolor: 'secondary.main',
                              color: 'text.primary',
                              '&:hover': {
                                bgcolor: 'secondary.dark',
                                color: 'text.primary',
                              },
                            }}
                          >
                            <HandshakeIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip title="Abrir lead">
                        <Box
                          component={Link}
                          href={`/leads/${lead.id}`}
                          aria-label={`Abrir lead ${lead.name}`}
                          onClick={(event) => event.stopPropagation()}
                          sx={{
                            display: 'inline-flex',
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 999,
                            bgcolor: 'secondary.main',
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                            },
                          }}
                        >
                          <NorthEastIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                        </Box>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}
