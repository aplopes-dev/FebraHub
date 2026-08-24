import type { Carrier } from '../entities/carrier.entity';

export const CARRIER_LIST_TABS = ['active', 'deleted'] as const;
export type CarrierListTab = (typeof CARRIER_LIST_TABS)[number];

export type CarrierListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz as não excluídas; `deleted`, só as
   * excluídas. Um booleano `includeDeleted` não daria conta: a aba "Excluídas"
   * precisa das excluídas **sozinhas**, não somadas às ativas.
   */
  tab?: CarrierListTab;
  skip?: number;
  take?: number;
};

export abstract class CarrierRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<Carrier | null>;
  abstract findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Carrier | null>;
  abstract findAll(
    organizationId: string,
    criteria?: CarrierListCriteria,
  ): Promise<Carrier[]>;
  abstract count(
    organizationId: string,
    criteria?: CarrierListCriteria,
  ): Promise<number>;
  /**
   * Grava a transportadora **e** os vínculos com as unidades na mesma
   * operação.
   *
   * Não há `replaceBranchAccess` separado de propósito: as unidades atendidas
   * fazem parte do cadastro que o formulário envia de uma vez, e salvar em duas
   * chamadas abriria a janela em que a transportadora existe apontando para a
   * lista de unidades antiga.
   */
  abstract save(carrier: Carrier): Promise<Carrier>;
}
