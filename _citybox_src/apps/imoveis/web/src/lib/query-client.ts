import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /** Dados de CRM mudam com pouca frequência em uso normal. */
        staleTime: 60_000,
        /** Evita cascata de refetches ao trocar aba / F5 de foco (sentia-se “refresh lento”). */
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}
