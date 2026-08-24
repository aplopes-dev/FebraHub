import type { BankAccount } from '../entities/bank-account.entity';

export const BANK_ACCOUNT_LIST_TABS = ['active', 'deleted'] as const;
export type BankAccountListTab = (typeof BANK_ACCOUNT_LIST_TABS)[number];

export type BankAccountListCriteria = {
  /** Busca no apelido da conta **ou** no nome do banco. */
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz as não excluídas; `deleted`, só as
   * excluídas. Um booleano `includeDeleted` não daria conta: a aba "Excluídas"
   * precisa das excluídas **sozinhas**, não somadas às ativas.
   */
  tab?: BankAccountListTab;
  skip?: number;
  take?: number;
};

export type BankAccountTabCounts = Record<BankAccountListTab, number>;

export abstract class BankAccountRepository {
  /** Devolve também a excluída — a aba "Excluídas" leva até o detalhe dela. */
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<BankAccount | null>;

  abstract findAll(
    organizationId: string,
    criteria?: BankAccountListCriteria,
  ): Promise<BankAccount[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<BankAccountListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores das abas — ignoram a busca de propósito. */
  abstract countByTabs(organizationId: string): Promise<BankAccountTabCounts>;

  /**
   * Contas ativas cujo `bankCode` bate com o informado — usada pela
   * auto-detecção de conta na importação de extrato OFX (só o código do
   * banco do arquivo, sem agência/número de conta reais no cadastro — ver
   * `research.md` R8 da spec `007-financeiro-ajustes-ui`): exatamente 1
   * resultado resolve a conta sozinho, 0 ou 2+ deixam a escolha manual.
   */
  abstract findActiveByBankCode(
    organizationId: string,
    bankCode: string,
  ): Promise<BankAccount[]>;

  abstract save(bankAccount: BankAccount): Promise<BankAccount>;

  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;
}
