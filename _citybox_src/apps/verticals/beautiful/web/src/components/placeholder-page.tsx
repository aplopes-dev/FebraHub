'use client';

import { PageHeader, Typography } from '@citybox/mui';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Página de exemplo do scaffold Beautiful. Substitua por uma feature em{' '}
        <code>src/features/</code> quando for implementar o domínio.
      </Typography>
    </>
  );
}
