import { Chip } from '@mui/material';

interface CatalogStatusBadgeProps {
  active: boolean;
}

export function CatalogStatusBadge({ active }: CatalogStatusBadgeProps) {
  return (
    <Chip
      label={active ? 'Ativo' : 'Inativo'}
      size="small"
      color={active ? 'success' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        px: 0.5,
      }}
    />
  );
}
