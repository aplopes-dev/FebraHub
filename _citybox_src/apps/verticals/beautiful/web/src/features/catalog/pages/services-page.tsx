'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataTable, ConfirmationDialog, type DataTableColumn } from '@citybox/mui/organisms';
import { Can, useCan } from '@/features/permissions';
import { SearchInput, toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { PREDEFINED_CATEGORIES } from '../data/mock-catalog';
import { CatalogStatusBadge } from '../components/catalog-status-badge';
import { ServicesHeaderCard } from '../components/services-header-card';
import { ServiceFormDrawer } from '../components/service-form-drawer';
import { CatalogItemDetailsDrawer } from '../components/catalog-item-details-drawer';
import { CatalogShell } from '../components/catalog-shell';
import {
  useServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceActiveMutation,
  useDeleteServiceMutation,
} from '../hooks/use-catalog-queries';
import type { ServiceItem, ServiceFormData } from '../types/catalog.types';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function ServicesPage() {
  const canUpdateService = useCan('update', 'Service');
  const canDeleteService = useCan('delete', 'Service');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);

  const queryParams = useMemo(() => {
    const search = debouncedSearchTerm.trim() || undefined;
    const category = categoryFilter !== 'all' ? categoryFilter : undefined;
    return { search, category, page, perPage };
  }, [debouncedSearchTerm, categoryFilter, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, categoryFilter]);

  const { data: servicesPage, isPending: loadingServices } =
    useServicesQuery(queryParams);
  const services = servicesPage?.data ?? [];
  const totalServices = servicesPage?.meta.total ?? 0;
  const stats = servicesPage?.stats;

  const createServiceMutation = useCreateServiceMutation();
  const updateServiceMutation = useUpdateServiceMutation();
  const toggleServiceActiveMutation = useToggleServiceActiveMutation();
  const deleteServiceMutation = useDeleteServiceMutation();

  const handleOpenNewService = () => {
    setEditingService(null);
    setIsServiceFormOpen(true);
  };

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service);
    setIsServiceFormOpen(true);
  };

  const handleServiceSubmit = (formData: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate(
        { id: editingService.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Serviço atualizado!', {
              description: `Os dados de ${formData.name} foram salvos com sucesso.`,
            });
            setIsServiceFormOpen(false);
          },
        },
      );
    } else {
      createServiceMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Serviço cadastrado!', {
            description: `${formData.name} foi adicionado ao catálogo.`,
          });
          setIsServiceFormOpen(false);
        },
      });
    }
  };

  const handleToggleServiceActive = (service: ServiceItem) => {
    toggleServiceActiveMutation.mutate(service.id, {
      onSuccess: (updated) => {
        if (selectedService?.id === service.id) {
          setSelectedService(updated);
        }
        toast.info(updated.active ? 'Serviço ativado' : 'Serviço desativado', {
          description: `${service.name} agora está ${updated.active ? 'ativo' : 'inativo'}.`,
        });
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingService) return;
    deleteServiceMutation.mutate(deletingService.id, {
      onSuccess: () => {
        toast.success('Serviço removido', {
          description: `${deletingService.name} foi excluído do catálogo.`,
        });
        setDeletingService(null);
      },
    });
  };

  const serviceColumns: DataTableColumn<ServiceItem>[] = [
    {
      id: 'name',
      header: 'Serviço',
      render: (row) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1 }}>
          <Avatar
            sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}
          >
            <Icon name="clock" size={20} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.description || 'Sem descrição'}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'categories',
      header: 'Categorias',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {row.categories.map((cat) => (
            <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
          ))}
        </Stack>
      ),
    },
    {
      id: 'durationMinutes',
      header: 'Duração',
      align: 'center',
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {row.durationMinutes}
        </Typography>
      ),
    },
    {
      id: 'price',
      header: 'Preço',
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {`R$ ${row.price.toFixed(2).replace('.', ',')}`}
        </Typography>
      ),
    },
    {
      id: 'active',
      header: 'Status',
      render: (row) => <CatalogStatusBadge active={row.active} />,
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
            <IconButton size="small" onClick={() => setSelectedService(row)}>
              <Icon name="eye" size={18} />
            </IconButton>
          </Tooltip>

          {canUpdateService ? (
            <Tooltip title="Editar">
              <IconButton size="small" color="primary" onClick={() => handleEditService(row)}>
                <Icon name="edit" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {canUpdateService ? (
            <Tooltip title={row.active ? 'Desativar' : 'Ativar'}>
              <IconButton
                size="small"
                color={row.active ? 'warning' : 'success'}
                onClick={() => handleToggleServiceActive(row)}
              >
                <Icon name={row.active ? 'close' : 'check'} size={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {canDeleteService ? (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeletingService(row)}>
                <Icon name="delete" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <CatalogShell>
      <ServicesHeaderCard stats={stats} isLoading={loadingServices} />

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box sx={{ width: { xs: '100%', sm: 360 } }}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviço por nome ou categoria..."
              fullWidth
            />
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoria"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">Todas Categorias</MenuItem>
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Can action="create" subject="Service">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Icon name="plus" size={18} />}
                onClick={handleOpenNewService}
              >
                Novo Serviço
              </Button>
            </Can>
          </Stack>
        </Stack>
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
        <DataTable
          rows={services}
          columns={serviceColumns}
          isLoading={loadingServices}
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedService(row)}
          emptyMessage="Nenhum serviço encontrado no catálogo."
          sx={{ flex: 1 }}
          pagination={{
            page,
            perPage,
            total: totalServices,
            onPageChange: setPage,
            onPerPageChange: (next) => {
              setPerPage(next);
              setPage(1);
            },
            perPageOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </Paper>

      <ServiceFormDrawer
        open={isServiceFormOpen}
        onClose={() => setIsServiceFormOpen(false)}
        onSubmit={handleServiceSubmit}
        serviceToEdit={editingService}
        isSubmitting={createServiceMutation.isPending || updateServiceMutation.isPending}
      />

      <CatalogItemDetailsDrawer
        open={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        item={selectedService}
        onEdit={(itemToEdit) => handleEditService(itemToEdit as ServiceItem)}
        onToggleActive={(itemToToggle) => handleToggleServiceActive(itemToToggle as ServiceItem)}
      />

      <ConfirmationDialog
        open={Boolean(deletingService)}
        title="Remover Serviço?"
        description={`Tem certeza que deseja remover "${deletingService?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Remover"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingService(null)}
      />
    </CatalogShell>
  );
}
