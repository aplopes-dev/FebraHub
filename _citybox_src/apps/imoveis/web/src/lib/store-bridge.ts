/**
 * Ponte síncrona para o `storeId` ativo — usada por `imoveisFetch` fora de React.
 * Atualizada pelo `StoreProvider` quando a loja muda.
 */
let activeStoreId: string | null = null;

export function registerActiveStoreId(storeId: string | null): void {
  activeStoreId = storeId?.trim() ? storeId.trim() : null;
}

export function getActiveStoreId(): string {
  if (activeStoreId) return activeStoreId;

  const devFallback = process.env.NEXT_PUBLIC_IMOVEIS_STORE_ID ?? 'dev-store-imoveis';
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[imoveis] X-Store-Id ausente — usando fallback de dev "${devFallback}". Selecione uma loja em /selecionar-loja.`,
    );
    return devFallback;
  }

  throw new Error('Loja não selecionada. Acesse /selecionar-loja.');
}
