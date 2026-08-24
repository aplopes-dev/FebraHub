import type { Supplier } from '../entities/supplier.entity';

export const SUPPLIER_LIST_TABS = ['active', 'deleted'] as const;
export type SupplierListTab = (typeof SUPPLIER_LIST_TABS)[number];

export type SupplierListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos. Um booleano `includeDeleted` não daria conta: a aba "Excluídos"
   * precisa dos excluídos **sozinhos**, não somados aos ativos.
   */
  tab?: SupplierListTab;
  skip?: number;
  take?: number;
};

export abstract class SupplierRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<Supplier | null>;
  abstract findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Supplier | null>;
  abstract findAll(
    organizationId: string,
    criteria?: SupplierListCriteria,
  ): Promise<Supplier[]>;
  abstract count(
    organizationId: string,
    criteria?: SupplierListCriteria,
  ): Promise<number>;
  /**
   * Grava o fornecedor **e** os vínculos com as unidades na mesma operação.
   *
   * Não há `replaceBranchAccess` separado de propósito: as unidades atendidas
   * fazem parte do cadastro que o formulário envia de uma vez, e salvar em duas
   * chamadas abriria a janela em que o fornecedor existe apontando para a lista
   * de unidades antiga.
   */
  abstract save(supplier: Supplier): Promise<Supplier>;
}
