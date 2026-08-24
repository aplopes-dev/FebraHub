import {
  Box,
  Typography,
  Stack,
  Button,
  Divider,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Drawer } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { Can } from '@/features/permissions';
import { CatalogStatusBadge } from './catalog-status-badge';
import { useServiceQuery } from '../hooks/use-catalog-queries';
import type { CatalogItem, ServiceItem, ProductItem } from '../types/catalog.types';

interface CatalogItemDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  item: CatalogItem | null;
  onEdit: (item: CatalogItem) => void;
  onToggleActive: (item: CatalogItem) => void;
}

export function CatalogItemDetailsDrawer({
  open,
  onClose,
  item,
  onEdit,
  onToggleActive,
}: CatalogItemDetailsDrawerProps) {
  const isService = item?.type === 'service';
  const serviceId = open && isService && item ? item.id : null;

  // Busca as informações completas via GET /v1/services/:id na API
  const { data: fetchedService, isPending: loadingServiceData } = useServiceQuery(serviceId);

  if (!item) return null;

  const service = isService ? (fetchedService || (item as ServiceItem)) : null;
  const product = !isService ? (item as ProductItem) : null;
  const updateSubject = isService ? 'Service' : 'Product';

  const footerNode = (
    <Stack direction="row" spacing={1.5} sx={{ width: '100%', justifyContent: 'flex-end' }}>
      <Can action="update" subject={updateSubject}>
        <Button
          variant="outlined"
          color={item.active ? 'warning' : 'success'}
          onClick={() => onToggleActive(item)}
        >
          {item.active ? 'Desativar' : 'Ativar'}
        </Button>
      </Can>

      <Can action="update" subject={updateSubject}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon name="edit" size={18} />}
          onClick={() => {
            onClose();
            onEdit(item);
          }}
        >
          Editar {isService ? 'Serviço' : 'Produto'}
        </Button>
      </Can>
    </Stack>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        isService ? 'Detalhes do Serviço' : 'Detalhes do Produto de Consumo'
      }
      subtitle="Visualização completa das informações"
      footer={footerNode}
      width={800}
    >
      <Stack spacing={3} sx={{ py: 2, position: 'relative' }}>
        {isService && loadingServiceData ? (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CircularProgress size={18} color="primary" />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Sincronizando informações completas do serviço via API...
            </Typography>
          </Paper>
        ) : null}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: isService ? 'primary.light' : 'secondary.light',
              color: 'primary.main',
            }}
          >
            <Icon name={isService ? 'clock' : 'products'} size={28} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {item.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
            >
              {isService &&
                service?.categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              <CatalogStatusBadge active={item.active} />
            </Stack>
          </Box>
        </Stack>

        <Divider />

        {isService && service ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                >
                  Preço de Venda
                </Typography>
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 700, mt: 0.5 }}
                >
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                >
                  Duração Estimada
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                  <Icon name="clock" size={20} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {service.durationMinutes} min
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : null}

        {!isService && product ? (
          <Stack spacing={2}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Código SKU / Referência
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {product.sku}
                  </Typography>
                </Box>
                <Chip
                  label={product.sku}
                  size="small"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Icon
                  name="products"
                  size={20}
                  sx={{
                    color:
                      product.stockQuantity <= product.minStockQuantity
                        ? 'error.main'
                        : 'success.main',
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estoque Atual / Mínimo
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {product.stockQuantity} {product.unitOfMeasure} (Mín:{' '}
                    {product.minStockQuantity} {product.unitOfMeasure})
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        ) : null}

        {item.description ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              width: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Descrição do Serviço
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ whiteSpace: 'pre-line', mt: 1, lineHeight: 1.6 }}
            >
              {item.description}
            </Typography>
          </Paper>
        ) : null}
      </Stack>
    </Drawer>
  );
}
