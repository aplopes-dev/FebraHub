'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '@citybox/mui/icons';
import { DataTable, type DataTableColumn } from '@citybox/mui/organisms';
import {
  AccountFormDialog,
  type AccountFormValues,
} from '../components/account-form-dialog';
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from '../components/category-form-dialog';
import {
  useCreateFinancialAccountMutation,
  useCreateFinancialCategoryMutation,
  useDeleteFinancialAccountMutation,
  useDeleteFinancialCategoryMutation,
  useExpenseCategoriesQuery,
  useFinancialAccountsQuery,
  useIncomeCategoriesQuery,
  useUpdateFinancialAccountMutation,
  useUpdateFinancialCategoryMutation,
} from '../hooks/use-financial-queries';
import type { FinancialAccount } from '../types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Caixa',
  checking: 'Conta corrente',
  savings: 'Poupança',
};

type CategoryRow = { id: string; name: string; color: string };

export function SettingsPage() {
  const [tab, setTab] = useState<
    'accounts' | 'expense-categories' | 'income-categories'
  >('accounts');

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<FinancialAccount | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const [categoryKind, setCategoryKind] = useState<'income' | 'expense'>(
    'expense',
  );

  const tabs = useMemo(
    () => [
      { value: 'accounts' as const, label: 'Contas Financeiras' },
      { value: 'expense-categories' as const, label: 'Categorias de Despesa' },
      { value: 'income-categories' as const, label: 'Categorias de Receita' },
    ],
    [],
  );

  const { data: accounts = [], isPending: accountsLoading } =
    useFinancialAccountsQuery({
      includeInactive: true,
    });
  const { data: expenseCategories = [], isPending: expenseLoading } =
    useExpenseCategoriesQuery();
  const { data: incomeCategories = [], isPending: incomeLoading } =
    useIncomeCategoriesQuery();

  const createAccount = useCreateFinancialAccountMutation();
  const updateAccount = useUpdateFinancialAccountMutation();
  const deleteAccount = useDeleteFinancialAccountMutation();

  const createExpenseCategory = useCreateFinancialCategoryMutation('expense');
  const createIncomeCategory = useCreateFinancialCategoryMutation('income');
  const updateCategory = useUpdateFinancialCategoryMutation();
  const deleteCategory = useDeleteFinancialCategoryMutation();

  const accountBusy =
    createAccount.isPending || updateAccount.isPending;
  const categoryBusy =
    createExpenseCategory.isPending ||
    createIncomeCategory.isPending ||
    updateCategory.isPending;

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountDialogOpen(true);
  };

  const openEditAccount = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setAccountDialogOpen(true);
  };

  const handleAccountSubmit = (values: AccountFormValues) => {
    if (editingAccount) {
      updateAccount.mutate(
        {
          id: editingAccount.id,
          data: {
            name: values.name,
            type: values.type,
            isActive: values.isActive,
          },
        },
        {
          onSuccess: () => {
            setAccountDialogOpen(false);
            setEditingAccount(null);
          },
        },
      );
      return;
    }
    createAccount.mutate(
      { name: values.name, type: values.type },
      {
        onSuccess: () => {
          setAccountDialogOpen(false);
        },
      },
    );
  };

  const openCreateCategory = (kind: 'income' | 'expense') => {
    setCategoryKind(kind);
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (
    kind: 'income' | 'expense',
    row: CategoryRow,
  ) => {
    setCategoryKind(kind);
    setEditingCategory(row);
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          data: { name: values.name, color: values.color },
        },
        {
          onSuccess: () => {
            setCategoryDialogOpen(false);
            setEditingCategory(null);
          },
        },
      );
      return;
    }
    const create =
      categoryKind === 'expense' ? createExpenseCategory : createIncomeCategory;
    create.mutate(
      { name: values.name, color: values.color },
      {
        onSuccess: () => {
          setCategoryDialogOpen(false);
        },
      },
    );
  };

  const accountColumns: DataTableColumn<FinancialAccount>[] = [
    {
      id: 'name',
      header: 'Nome',
      render: (row) => row.name,
    },
    {
      id: 'type',
      header: 'Tipo',
      render: (row) => ACCOUNT_TYPE_LABELS[row.type] ?? row.type,
    },
    {
      id: 'status',
      header: 'Status',
      render: (row) => (
        <Chip
          size="small"
          label={row.isActive ? 'Ativa' : 'Inativa'}
          color={row.isActive ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'right',
      width: 100,
      render: (row) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Tooltip title="Editar">
            <IconButton
              size="small"
              aria-label="Editar"
              onClick={() => openEditAccount(row)}
            >
              <Icon name="edit" size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              size="small"
              aria-label="Excluir"
              color="error"
              onClick={() => deleteAccount.mutate(row.id)}
            >
              <Icon name="delete" size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const [accountPage, setAccountPage] = useState(1);
  const [accountPerPage, setAccountPerPage] = useState(10);

  const paginatedAccounts = useMemo(() => {
    const start = (accountPage - 1) * accountPerPage;
    return accounts.slice(start, start + accountPerPage);
  }, [accounts, accountPage, accountPerPage]);

  const categoryDialogTitle = editingCategory
    ? 'Editar categoria'
    : categoryKind === 'expense'
      ? 'Nova categoria de despesa'
      : 'Nova categoria de receita';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 0.5,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1.5,
              px: 2,
              mr: 0.5,
            },
            '& .Mui-selected': {
              bgcolor: 'background.paper',
              boxShadow: 1,
            },
          }}
        >
          {tabs.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      {tab === 'accounts' ? (
        <ConfigTableShell
          title="Contas Financeiras"
          onAdd={openCreateAccount}
        >
          <DataTable
            columns={accountColumns}
            rows={paginatedAccounts}
            getRowId={(row) => row.id}
            isLoading={accountsLoading}
            emptyMessage="Nenhuma conta cadastrada."
            pagination={{
              page: accountPage,
              perPage: accountPerPage,
              total: accounts.length,
              onPageChange: setAccountPage,
              onPerPageChange: (next) => {
                setAccountPerPage(next);
                setAccountPage(1);
              },
              perPageOptions: [10, 25, 50],
            }}
          />
        </ConfigTableShell>
      ) : null}

      {tab === 'expense-categories' ? (
        <CategoryTable
          title="Categorias de Despesa"
          rows={expenseCategories}
          isLoading={expenseLoading}
          onAdd={() => openCreateCategory('expense')}
          onEdit={(row) => openEditCategory('expense', row)}
          onDelete={(id) => deleteCategory.mutate(id)}
        />
      ) : null}

      {tab === 'income-categories' ? (
        <CategoryTable
          title="Categorias de Receita"
          rows={incomeCategories}
          isLoading={incomeLoading}
          onAdd={() => openCreateCategory('income')}
          onEdit={(row) => openEditCategory('income', row)}
          onDelete={(id) => deleteCategory.mutate(id)}
        />
      ) : null}

      <AccountFormDialog
        open={accountDialogOpen}
        onClose={() => {
          setAccountDialogOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleAccountSubmit}
        account={editingAccount}
        loading={accountBusy}
      />

      <CategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        title={categoryDialogTitle}
        loading={categoryBusy}
      />
    </Box>
  );
}

function ConfigTableShell({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Button
          startIcon={<Icon name="plus" size={18} />}
          variant="contained"
          size="small"
          onClick={onAdd}
        >
          Adicionar
        </Button>
      </Stack>
      <Box>{children}</Box>
    </Paper>
  );
}

function CategoryTable({
  title,
  rows,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  rows: CategoryRow[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (row: CategoryRow) => void;
  onDelete: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  const columns: DataTableColumn<CategoryRow>[] = [
    {
      id: 'name',
      header: 'Nome',
      render: (row) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: row.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2">{row.name}</Typography>
        </Stack>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'right',
      width: 100,
      render: (row) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Tooltip title="Editar">
            <IconButton
              size="small"
              aria-label="Editar"
              onClick={() => onEdit(row)}
            >
              <Icon name="edit" size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              size="small"
              aria-label="Excluir"
              color="error"
              onClick={() => onDelete(row.id)}
            >
              <Icon name="delete" size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <ConfigTableShell title={title} onAdd={onAdd}>
      <DataTable
        columns={columns}
        rows={paginatedRows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma categoria cadastrada."
        pagination={{
          page,
          perPage,
          total: rows.length,
          onPageChange: setPage,
          onPerPageChange: (next) => {
            setPerPage(next);
            setPage(1);
          },
          perPageOptions: [10, 25, 50],
        }}
      />
    </ConfigTableShell>
  );
}
