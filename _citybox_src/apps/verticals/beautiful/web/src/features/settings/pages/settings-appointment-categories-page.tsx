'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { FormField, toast } from '@citybox/mui/molecules';
import {
  ConfirmationDialog,
  DataTable,
  type DataTableColumn,
} from '@citybox/mui/organisms';
import { Icon } from '@citybox/mui/icons';
import { useCan } from '@/features/permissions';
import {
  DEFAULT_CATEGORY_HEX,
  normalizeCategoryHex,
} from '@/lib/category-colors';
import { SettingsShell } from '@/features/settings/components/settings-shell';
import { CategoryColorBadge } from '@/features/settings/components/category-color-picker';
import { CategoryColorField } from '@/features/settings/components/category-color-field';
import { settingsInputSx } from '@/features/settings/lib/settings-muted';
import type { AppointmentCategory } from '../services/appointment-categories-service';
import {
  useAppointmentCategoriesQuery,
  useCreateAppointmentCategoryMutation,
  useDeleteAppointmentCategoryMutation,
  useUpdateAppointmentCategoryMutation,
} from '../hooks/use-appointment-categories-queries';

export function SettingsAppointmentCategoriesPage() {
  const canCreateCategory = useCan('create', 'Category');
  const canUpdateCategory = useCan('update', 'Category');
  const { data = [], isPending, isError } = useAppointmentCategoriesQuery();
  const createMutation = useCreateAppointmentCategoryMutation();
  const updateMutation = useUpdateAppointmentCategoryMutation();
  const deleteMutation = useDeleteAppointmentCategoryMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentCategory | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_CATEGORY_HEX);
  const [nameError, setNameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AppointmentCategory | null>(
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setColor(DEFAULT_CATEGORY_HEX);
    setNameError('');
    setFormOpen(true);
  };

  const openEdit = (category: AppointmentCategory) => {
    setEditing(category);
    setName(category.name);
    setColor(normalizeCategoryHex(category.color));
    setNameError('');
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Informe um nome com no mínimo 2 caracteres.');
      return;
    }
    const trimmed = name.trim();
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, name: trimmed, color: normalizeCategoryHex(color) },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast.success('Categoria atualizada');
          },
          onError: () =>
            toast.error('Não foi possível salvar', {
              description: 'O nome pode já estar em uso.',
            }),
        },
      );
      return;
    }
    createMutation.mutate(
      { name: trimmed, color: normalizeCategoryHex(color) },
      {
        onSuccess: () => {
          setFormOpen(false);
          toast.success('Categoria criada');
        },
        onError: () =>
          toast.error('Não foi possível criar', {
            description: 'O nome pode já estar em uso.',
          }),
      },
    );
  };

  const columns: DataTableColumn<AppointmentCategory>[] = [
    {
      id: 'name',
      header: 'Nome',
      render: (row) => (
        <CategoryColorBadge colorId={row.color} label={row.name} />
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          {canUpdateCategory ? (
            <IconButton
              size="small"
              aria-label="Editar"
              onClick={() => openEdit(row)}
            >
              <Icon name="edit" size={18} />
            </IconButton>
          ) : null}
          {canUpdateCategory ? (
            <IconButton
              size="small"
              aria-label="Excluir"
              color="error"
              onClick={() => setDeleteTarget(row)}
            >
              <Icon name="delete" size={18} />
            </IconButton>
          ) : null}
        </Stack>
      ),
    },
  ];

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, page, perPage]);

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <SettingsShell>
      {canCreateCategory ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Icon name="plus" size={18} />}
            onClick={openCreate}
            sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
          >
            Nova categoria
          </Button>
        </Paper>
      ) : null}

      {isError ? (
        <Typography color="error">Não foi possível carregar as categorias.</Typography>
      ) : (
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
          <DataTable
            columns={columns}
            rows={paginatedData}
            getRowId={(row) => row.id}
            isLoading={isPending}
            emptyMessage="Nenhuma categoria cadastrada."
            pagination={{
              page,
              perPage,
              total: data.length,
              onPageChange: setPage,
              onPerPageChange: (next) => {
                setPerPage(next);
                setPage(1);
              },
              perPageOptions: [10, 25, 50],
            }}
          />
        </Paper>
      )}

      <Dialog open={formOpen} onClose={() => !busy && setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormField
              label="Nome *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(nameError)}
              helperText={nameError}
              sx={settingsInputSx}
              fullWidth
            />
            <CategoryColorField value={color} onChange={setColor} disabled={busy} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setFormOpen(false)} disabled={busy}>
            Fechar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={deleteTarget !== null}
        title="Excluir categoria?"
        description={
          deleteTarget
            ? `A categoria "${deleteTarget.name}" será removida. Agendamentos vinculados ficam sem categoria.`
            : undefined
        }
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              toast.success('Categoria removida');
            },
            onError: () =>
              toast.error('Não foi possível excluir a categoria', {
                description: 'Existem agendamentos vinculados a esta categoria.',
              }),
          });
        }}
      />
    </SettingsShell>
  );
}
