import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Stack, Typography } from '@citybox/mui/atoms';

type ModuleBackLinkProps = {
  href: string;
  label: string;
};

/** Link de retorno à listagem do módulo (páginas new / [id]). */
export function ModuleBackLink({ href, label }: ModuleBackLinkProps) {
  return (
    <Stack
      component={Link}
      href={href}
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        textDecoration: 'none',
        color: 'text.secondary',
        transition: 'color 0.15s',
        '&:hover': { color: 'text.primary' },
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 16, flexShrink: 0 }} aria-hidden />
      <Typography variant="body2" component="span" sx={{ color: 'inherit' }}>
        {label}
      </Typography>
    </Stack>
  );
}
