import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sem conexão</h1>
        <p className="text-muted-foreground">
          Não foi possível carregar esta página. Verifique a rede e tente
          novamente.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
      >
        Voltar ao PDV
      </Link>
    </main>
  );
}
