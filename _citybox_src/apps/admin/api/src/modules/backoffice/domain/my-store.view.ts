export type MyStoreView = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  /**
   * Mesmo valor de `id`. O contrato mantém o campo porque o ERP e os apps das verticais
   * já o consomem; desde o PLAT-001 a Loja é o próprio cliente do Citybox.
   */
  clientId: string;
  clientName: string;
};
