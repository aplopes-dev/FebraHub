'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { DatePicker, toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import {
  isoDateToLocalDate,
  localDateToIsoDate,
} from '@/features/shared/utils/calendar';
import { formatCents } from '@/features/shared/utils/format';
import { downloadCsv } from '@/features/shared/utils/download-csv';
import { useTransactionsReport } from '../hooks/use-transactions-report';
import { pickerControlSx } from '../utils/form-control-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import type { SxProps, Theme } from '@mui/material/styles';

const reportOutlineButtonSx: SxProps<Theme> = (theme) => ({
  height: 44,
  width: { xs: '100%', sm: 'auto' },
  flexShrink: 0,
  borderRadius: { xs: '10px', sm: '999px' },
  textTransform: 'none',
  whiteSpace: 'nowrap',
  bgcolor: listifyElevatedSurface(theme),
});

/**
 * Relatórios consolidados (filtro de período + tabelas).
 * Vive na aba Financeiro — KPIs de negócios ficam em `/transactions`.
 */
export function TransactionsReportsSection() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const period = from || to ? { from: from || undefined, to: to || undefined } : undefined;
  const { data, isLoading, isError } = useTransactionsReport(period);

  function handleExport() {
    if (!data) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const rows: (string | number)[][] = [
      ['--- Por status ---', '', '', ''],
      ['Status', 'Qtd.', 'Valor bruto', 'Comissão'],
      ...data.byStatus.map((row) => [
        row.label,
        row.count,
        formatCents(row.grossValueCents),
        formatCents(row.commissionCents),
      ]),
      ['', '', '', ''],
      ['--- Por tipo ---', '', '', ''],
      ['Tipo', 'Qtd.', 'Valor bruto', 'Comissão'],
      ...data.byType.map((row) => [
        row.label,
        row.count,
        formatCents(row.grossValueCents),
        formatCents(row.commissionCents),
      ]),
      ['', '', '', ''],
      ['--- Por corretor ---', '', ''],
      ['Corretor', 'Negócios', 'Comissão'],
      ...data.byAgent.map((row) => [
        row.agentName,
        row.dealsCount,
        formatCents(row.commissionCents),
      ]),
    ];

    downloadCsv('relatorio-negocios.csv', ['Coluna A', 'Coluna B', 'Coluna C', 'Coluna D'], rows);
    toast.success('CSV exportado');
  }

  return (
    <Stack spacing={{ xs: 1.75, sm: 2 }} sx={{ minWidth: 0, width: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          alignItems: { xs: 'stretch', sm: 'flex-end' },
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.125rem' } }}
          >
            Relatórios
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.25, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Consolidado por status, tipo e corretor — filtre por período.
          </Typography>
        </Box>
        <Button
          type="button"
          variant="outlined"
          sx={reportOutlineButtonSx}
          onClick={handleExport}
        >
          Exportar
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.25}
        sx={{
          alignItems: { xs: 'stretch', sm: 'flex-end' },
          minWidth: 0,
          width: '100%',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <DatePicker
            id="report-from"
            label="De"
            value={isoDateToLocalDate(from)}
            maxDate={isoDateToLocalDate(to)}
            onChange={(date) => setFrom(localDateToIsoDate(date))}
            sx={pickerControlSx}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <DatePicker
            id="report-to"
            label="Até"
            value={isoDateToLocalDate(to)}
            minDate={isoDateToLocalDate(from)}
            onChange={(date) => setTo(localDateToIsoDate(date))}
            sx={pickerControlSx}
          />
        </Box>
        <Button
          type="button"
          variant="outlined"
          sx={reportOutlineButtonSx}
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Limpar período
        </Button>
      </Stack>

      {isLoading ? (
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: {
              xs: '1fr',
              xl: 'repeat(2, minmax(0, 1fr))',
            },
            minWidth: 0,
          }}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={220}
              sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
            />
          ))}
        </Box>
      ) : isError || !data ? (
        <Panel
          className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12"
          sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
        >
          Erro ao carregar relatórios.
        </Panel>
      ) : (
        <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ minWidth: 0, width: '100%' }}>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 1.5, sm: 2 },
              gridTemplateColumns: {
                xs: '1fr',
                xl: 'repeat(2, minmax(0, 1fr))',
              },
              minWidth: 0,
              width: '100%',
            }}
          >
            <ReportTable
              title="Por status"
              headers={['Status', 'Qtd.', 'Valor bruto', 'Comissão']}
              rows={data.byStatus.map((row) => [
                row.label,
                String(row.count),
                formatCents(row.grossValueCents),
                formatCents(row.commissionCents),
              ])}
              numericFromIndex={1}
            />
            <ReportTable
              title="Por tipo"
              headers={['Tipo', 'Qtd.', 'Valor bruto', 'Comissão']}
              rows={data.byType.map((row) => [
                row.label,
                String(row.count),
                formatCents(row.grossValueCents),
                formatCents(row.commissionCents),
              ])}
              numericFromIndex={1}
            />
          </Box>

          <ReportTable
            title="Comissões por corretor"
            headers={['Corretor', 'Negócios', 'Comissão']}
            rows={data.byAgent.map((row) => [
              row.agentName,
              String(row.dealsCount),
              formatCents(row.commissionCents),
            ])}
            numericFromIndex={1}
          />
        </Stack>
      )}
    </Stack>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  numericFromIndex = 1,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  /** Colunas a partir deste índice alinham à direita (qtd./valores). */
  numericFromIndex?: number;
}) {
  return (
    <Panel
      className="overflow-hidden p-0"
      sx={{
        borderRadius: { xs: '14px', sm: '20px' },
        minWidth: 0,
        width: '100%',
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 1.75, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 500,
            fontSize: { xs: '0.9375rem', sm: '1.125rem' },
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{
            width: '100%',
            minWidth: headers.length >= 4 ? 320 : 260,
            fontSize: { xs: 13, sm: 14 },
            borderCollapse: 'collapse',
          }}
        >
          <Box component="thead">
            <Box component="tr" sx={{ borderBottom: 1, borderColor: 'divider' }}>
              {headers.map((header, headerIndex) => (
                <Box
                  key={header}
                  component="th"
                  sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1.25,
                    textAlign:
                      headerIndex >= numericFromIndex ? 'right' : 'left',
                    fontWeight: 500,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.length === 0 ? (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={headers.length}
                  sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    py: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  Sem dados no período.
                </Box>
              </Box>
            ) : (
              rows.map((row, index) => (
                <Box
                  key={index}
                  component="tr"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  {row.map((cell, cellIndex) => {
                    const isNumeric = cellIndex >= numericFromIndex;
                    return (
                      <Box
                        key={cellIndex}
                        component="td"
                        sx={{
                          px: { xs: 1.5, sm: 2.5 },
                          py: { xs: 1.25, sm: 1.5 },
                          fontWeight: cellIndex === 0 ? 500 : undefined,
                          color:
                            cellIndex === 0 ? 'text.primary' : 'text.secondary',
                          textAlign: isNumeric ? 'right' : 'left',
                          fontVariantNumeric: isNumeric
                            ? 'tabular-nums'
                            : undefined,
                          whiteSpace: isNumeric ? 'nowrap' : 'normal',
                          minWidth: cellIndex === 0 ? 0 : undefined,
                          maxWidth: cellIndex === 0 ? { xs: 140, sm: 'none' } : undefined,
                          ...(cellIndex === 0
                            ? {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }
                            : {}),
                        }}
                      >
                        {cell}
                      </Box>
                    );
                  })}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Panel>
  );
}
