'use client';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import type { FinancialStats } from '../types';
import { formatCurrency } from '../lib/filter-entries';

type CashFlowStatsProps = FinancialStats & {
  showIncome?: boolean;
  showExpense?: boolean;
  showBalance?: boolean;
};

function IncomeCard({ income }: { income: FinancialStats['income'] }) {
  const progress =
    income.total > 0
      ? Math.min((income.received / income.total) * 100, 100)
      : 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              color: 'success.main',
            })}
          >
            <TrendingUpIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Receita
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'success.dark', lineHeight: 1.2 }}
              noWrap
              title={formatCurrency(income.received)}
            >
              {formatCurrency(income.received)}
            </Typography>
          </Box>
        </Stack>
        <Box>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              A receber
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {formatCurrency(income.toReceive)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="success"
            sx={{ height: 8, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Total previsto: {formatCurrency(income.total)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function ExpenseCard({ expense }: { expense: FinancialStats['expense'] }) {
  const progress =
    expense.total > 0 ? Math.min((expense.paid / expense.total) * 100, 100) : 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              color: 'error.main',
            })}
          >
            <TrendingDownIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Despesa
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'error.dark', lineHeight: 1.2 }}
              noWrap
              title={formatCurrency(expense.paid)}
            >
              {formatCurrency(expense.paid)}
            </Typography>
          </Box>
        </Stack>
        <Box>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              A pagar
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {formatCurrency(expense.toPay)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="error"
            sx={{ height: 8, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Total previsto: {formatCurrency(expense.total)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function BalanceCard({ balance }: { balance: FinancialStats['balance'] }) {
  const isCurrentNegative = balance.current < 0;
  const isProjectedNegative = balance.projected < 0;
  const isProjectedBetter = balance.projected > balance.current;
  const isProjectedWorse = balance.projected < balance.current;
  const TrendIcon = isProjectedBetter
    ? ArrowUpwardIcon
    : isProjectedWorse
      ? ArrowDownwardIcon
      : RemoveIcon;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', height: '100%' }}>
      <Box
        sx={(theme) => ({
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pb: 1.5,
          bgcolor: alpha(
            isCurrentNegative
              ? theme.palette.error.main
              : theme.palette.info.main,
            0.08,
          ),
        })}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between' }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ minWidth: 0, alignItems: 'flex-start' }}
          >
            <Box
              sx={(theme) => ({
                width: 40,
                height: 40,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(
                  isCurrentNegative
                    ? theme.palette.error.main
                    : theme.palette.info.main,
                  0.12,
                ),
                color: isCurrentNegative ? 'error.main' : 'info.main',
              })}
            >
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}
              >
                Saldo atual
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: isCurrentNegative ? 'error.dark' : 'info.dark',
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {formatCurrency(balance.current)}
              </Typography>
            </Box>
          </Stack>
          <Typography
            variant="caption"
            sx={(theme) => ({
              alignSelf: 'flex-start',
              px: 1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: alpha(
                isCurrentNegative
                  ? theme.palette.error.main
                  : theme.palette.info.main,
                0.14,
              ),
              color: isCurrentNegative ? 'error.dark' : 'info.dark',
              fontWeight: 500,
            })}
          >
            {isCurrentNegative ? 'Negativo' : 'Positivo'}
          </Typography>
        </Stack>
      </Box>
      <Box
        sx={{
          borderTop: '1px dashed',
          borderColor: 'divider',
          mx: { xs: 1.5, sm: 2 },
        }}
      />
      <Stack
        direction="row"
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.5,
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Saldo previsto
          </Typography>
          <Typography
            variant="subtitle1"
            color={isProjectedNegative ? 'error.main' : 'text.primary'}
            sx={{ fontWeight: 600 }}
          >
            {formatCurrency(balance.projected)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ao fim do período
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={0.5}
          sx={(theme) => ({
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: isProjectedBetter
              ? alpha(theme.palette.success.main, 0.1)
              : isProjectedWorse
                ? alpha(theme.palette.error.main, 0.1)
                : theme.palette.action.hover,
            color: isProjectedBetter
              ? 'success.dark'
              : isProjectedWorse
                ? 'error.main'
                : 'text.secondary',
            typography: 'caption',
            fontWeight: 500,
          })}
        >
          <TrendIcon sx={{ fontSize: 14 }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {isProjectedBetter
              ? 'Melhora'
              : isProjectedWorse
                ? 'Piora'
                : 'Estável'}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function CashFlowStats({
  income,
  expense,
  balance,
  showIncome = true,
  showExpense = true,
  showBalance = true,
}: CashFlowStatsProps) {
  const visible =
    Number(showIncome) + Number(showExpense) + Number(showBalance);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: {
          xs: '1fr',
          sm: visible >= 2 ? '1fr 1fr' : '1fr',
          xl: visible >= 3 ? '1fr 1fr 1fr' : visible === 2 ? '1fr 1fr' : '1fr',
        },
      }}
    >
      {showIncome ? <IncomeCard income={income} /> : null}
      {showExpense ? <ExpenseCard expense={expense} /> : null}
      {showBalance ? (
        <Box
          sx={{
            gridColumn: {
              sm: visible >= 3 ? '1 / -1' : 'auto',
              xl: 'auto',
            },
          }}
        >
          <BalanceCard balance={balance} />
        </Box>
      ) : null}
    </Box>
  );
}
