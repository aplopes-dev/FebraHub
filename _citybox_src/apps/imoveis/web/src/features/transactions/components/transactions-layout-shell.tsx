'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { cn } from '@/lib/cn';

const SUB_NAV = [
  { href: '/transactions', label: 'Negócios', exact: true },
  { href: '/transactions/finance', label: 'Financeiro', exact: false },
] as const;

type TransactionsLayoutShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function TransactionsLayoutShell({
  title,
  description,
  children,
}: TransactionsLayoutShellProps) {
  const pathname = usePathname();

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>

        <Box
          component="nav"
          aria-label="Sub-navegação de transações"
          className="inline-flex w-full max-w-full items-center gap-1 rounded-[10px] bg-secondary p-1 sm:w-auto"
        >
          {SUB_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-9 flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none sm:px-5',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </Box>
      </Stack>

      {children}
    </Stack>
  );
}
