import React from "react";

/**
 * Vendorizado no lugar de `@/components/layout/page/page-container` do
 * OdontoTech. Versão enxuta para a vertical clínica: a `main` do AppSidebar
 * (fillViewport) já é o container de scroll, então aqui basta o padding e o
 * cabeçalho opcional. Mantém a API usada pela feature de Marketing.
 */

function PageSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-4 p-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-6 h-40 w-full rounded-lg bg-muted" />
      <div className="h-40 w-full rounded-lg bg-muted" />
    </div>
  );
}

export function PageContainer({
  children,
  isloading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  pageHeaderAction,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  isloading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageHeaderAction?: React.ReactNode;
}) {
  if (!access) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:px-6">
        {accessFallback ?? (
          <div className="text-center text-lg text-muted-foreground">
            Você não tem acesso a esta página.
          </div>
        )}
      </div>
    );
  }

  if (isloading) {
    return <PageSkeleton />;
  }

  const hasHeader = Boolean(pageTitle || pageDescription || pageHeaderAction);

  return (
    <div className="flex flex-col p-4 md:p-6">
      {hasHeader && (
        <div className="flex items-start justify-between">
          <div>
            {pageTitle && (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {pageTitle}
              </h1>
            )}
            {pageDescription && (
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            )}
          </div>
          {pageHeaderAction ? <div>{pageHeaderAction}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
