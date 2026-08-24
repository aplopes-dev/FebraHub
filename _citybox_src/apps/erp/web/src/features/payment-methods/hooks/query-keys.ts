/**
 * Chaves de cache das formas de pagamento. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache.
 */
export const paymentMethodKeys = {
  all: (scope: string) => ["comercio", "payment-methods", scope] as const,
  list: (scope: string) => [...paymentMethodKeys.all(scope), "list"] as const,
  options: (scope: string) =>
    [...paymentMethodKeys.all(scope), "options"] as const,
};
