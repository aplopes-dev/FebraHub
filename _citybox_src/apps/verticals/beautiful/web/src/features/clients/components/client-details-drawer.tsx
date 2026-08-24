'use client';

import {
  Box,
  Typography,
  Stack,
  Button,
  Divider,
  Avatar,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Drawer } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { Can } from '@/features/permissions';
import { CategoryColorBadge } from '@/features/settings/components/category-color-picker';
import { digitsOnly, formatPhoneBR } from '@/lib/field-masks';
import type { Client } from '../types/client.types';

type ClientDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
};

function clientInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function ClientDetailsDrawer({
  open,
  onClose,
  client,
  onEdit,
}: ClientDetailsDrawerProps) {
  if (!client) return null;

  const phoneDigits = digitsOnly(client.phone);
  const whatsappUrl =
    phoneDigits.length >= 10 ? `https://wa.me/55${phoneDigits}` : null;

  const footerNode = (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ width: '100%', justifyContent: 'flex-end' }}
    >
      {whatsappUrl ? (
        <Button
          component="a"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          startIcon={<Icon name="phone" size={18} />}
        >
          Conversar no WhatsApp
        </Button>
      ) : null}

      <Can action="update" subject="Client">
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon name="edit" size={18} />}
          onClick={() => {
            onClose();
            onEdit(client);
          }}
        >
          Editar Cliente
        </Button>
      </Can>
    </Stack>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Detalhes do Cliente"
      subtitle="Visualização completa das informações"
      footer={footerNode}
      width={800}
    >
      <Stack spacing={3} sx={{ py: 2, position: 'relative' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            alt={client.name}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.light',
              color: 'primary.main',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {clientInitials(client.name) || '?'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {client.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
            >
              {client.categoryName ? (
                <CategoryColorBadge
                  colorId={client.categoryColorId}
                  label={client.categoryName}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Sem categoria
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Divider />

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
                Celular / WhatsApp
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mt: 0.5 }}
              >
                <Icon name="phone" size={20} sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatPhoneBR(client.phone)}
                </Typography>
              </Stack>
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
                Data de Cadastro
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mt: 0.5 }}
              >
                <Icon name="calendar" size={20} sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCreatedAt(client.createdAt)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Drawer>
  );
}
