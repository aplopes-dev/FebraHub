'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Stack,
  Button,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DataTable,
  ConfirmationDialog,
  type DataTableColumn,
} from '@citybox/mui/organisms';
import { Can, useCan } from '@/features/permissions';
import { SearchInput, toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { CategoryColorBadge } from '@/features/settings/components/category-color-picker';
import { ClientFormDrawer } from '../components/client-form-drawer';
import { ClientDetailsDrawer } from '../components/client-details-drawer';
import {
  useClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from '../hooks/use-clients-queries';
import type { Client, ClientFormData } from '../types/client.types';

export function ClientsPage() {
  const canUpdateClient = useCan('update', 'Client');
  const canDeleteClient = useCan('delete', 'Client');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const queryParams = useMemo(() => {
    const search = debouncedSearchTerm.trim() || undefined;
    return {
      search,
      page,
      perPage,
    };
  }, [debouncedSearchTerm, page, perPage]);

  const {
    data: clientsPage,
    isPending: loading,
    isError,
  } = useClientsQuery(queryParams);

  const clients = clientsPage?.data ?? [];
  const meta = clientsPage?.meta ?? { total: 0, page: 1, perPage: 10, totalPages: 0 };
  const stats = clientsPage?.stats ?? { totalClients: 0, withCategoryCount: 0, withoutCategoryCount: 0 };

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();

  const handleCreateNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate(
        { id: editingClient.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Cliente atualizado!', {
              description: `Os dados de ${formData.name} foram salvos com sucesso.`,
            });
            setIsFormOpen(false);
          },
          onError: () => {
            toast.error('Não foi possível salvar o cliente', {
              description:
                'Ocorreu um problema ao salvar as informações. Por favor, tente novamente.',
            });
          },
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Cliente cadastrado!', {
            description: `${formData.name} foi adicionado(a) à lista.`,
          });
          setIsFormOpen(false);
        },
        onError: () => {
          toast.error('Não foi possível cadastrar o cliente', {
            description:
              'Ocorreu um problema ao registrar o cliente. Por favor, tente novamente.',
          });
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingClient) return;
    deleteMutation.mutate(deletingClient.id, {
      onSuccess: () => {
        toast.success('Cliente removido', {
          description: `${deletingClient.name} foi removido(a) do sistema.`,
        });
        if (selectedClient?.id === deletingClient.id) {
          setSelectedClient(null);
        }
        setDeletingClient(null);
      },
      onError: () => {
        toast.error('Não foi possível remover o cliente', {
          description:
            'Ocorreu um problema ao excluir o cadastro. Tente novamente em instantes.',
        });
        setDeletingClient(null);
      },
    });
  };

  const columns: DataTableColumn<Client>[] = [
    {
      id: 'name',
      header: 'Cliente',
      render: (row) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1 }}>
          <Avatar
            alt={row.name}
            sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 600 }}
          >
            {row.name.charAt(0)}
          </Avatar>
          <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'phone',
      header: 'Telefone / WhatsApp',
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Icon name="phone" size={16} sx={{ color: 'text.secondary' }} />
          <Typography variant="body2">{row.phone}</Typography>
        </Stack>
      ),
    },
    {
      id: 'category',
      header: 'Categoria',
      render: (row) =>
        row.categoryName ? (
          <CategoryColorBadge
            colorId={row.categoryColorId}
            label={row.categoryName}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      id: 'createdAt',
      header: 'Cadastro',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString('pt-BR')}
        </Typography>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Visualizar detalhes">
            <IconButton size="small" onClick={() => setSelectedClient(row)}>
              <Icon name="eye" size={18} />
            </IconButton>
          </Tooltip>

          {canUpdateClient ? (
            <Tooltip title="Editar">
              <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                <Icon name="edit" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {canDeleteClient ? (
            <Tooltip title="Excluir">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeletingClient(row)}
                disabled={deleteMutation.isPending}
              >
                <Icon name="delete" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Total de Clientes
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                  {stats.totalClients}
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 44, height: 44 }}
              >
                <Icon name="users" size={22} />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Com Categoria
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                  {stats.withCategoryCount}
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: 'success.light', color: 'white', width: 44, height: 44 }}
              >
                <Icon name="tag" size={22} />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Sem Categoria
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                  {stats.withoutCategoryCount}
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: 'action.hover', color: 'text.secondary', width: 44, height: 44 }}
              >
                <Icon name="user" size={22} />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ width: { xs: '100%', sm: 360 } }}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou telefone..."
            fullWidth
          />
        </Box>

        <Can action="create" subject="Client">
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Icon name="plus" size={18} />}
            onClick={handleCreateNew}
            sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
          >
            Novo Cliente
          </Button>
        </Can>
      </Paper>

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
        {isError ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justify: 'center',
              flex: 1,
              py: 8,
              px: 2,
              textAlign: 'center',
            }}
          >
            <Icon
              name="close"
              size={48}
              sx={{ color: 'error.main', opacity: 0.7, mb: 1 }}
            />
            <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
              Não foi possível carregar os clientes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ocorreu uma indisponibilidade temporária no sistema. Por favor, tente
              recarregar a página em instantes.
            </Typography>
          </Box>
        ) : (
          <DataTable
            rows={clients}
            columns={columns}
            isLoading={loading}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedClient(row)}
            emptyMessage="Nenhum cliente cadastrado."
            pagination={{
              page,
              perPage,
              total: meta.total,
              onPageChange: (newPage) => setPage(newPage),
              onPerPageChange: (newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              },
            }}
            sx={{ flex: 1 }}
          />
        )}
      </Paper>

      <ClientFormDrawer
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        clientToEdit={editingClient}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ClientDetailsDrawer
        open={Boolean(selectedClient)}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onEdit={handleEdit}
      />

      <ConfirmationDialog
        open={Boolean(deletingClient)}
        title="Remover Cliente?"
        description={`Tem certeza que deseja remover ${deletingClient?.name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Remover"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingClient(null)}
      />
    </Box>
  );
}
