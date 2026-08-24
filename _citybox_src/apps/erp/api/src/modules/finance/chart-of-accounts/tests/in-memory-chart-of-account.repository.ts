import { ChartOfAccount } from '../domain/entities/chart-of-account.entity';
import {
  ChartOfAccountRepository,
  type ChartOfAccountFinancialGroupType,
  type ChartOfAccountListCriteria,
  type ChartOfAccountWithGroup,
} from '../domain/repositories/chart-of-account.repository.interface';

/**
 * Fonte dos grupos financeiros para o enriquecimento da listagem.
 *
 * Tipo estrutural em vez do `FinancialGroupRepository` concreto: o fake do
 * módulo irmão o satisfaz, e o in-memory daqui não precisa saber que existe uma
 * classe abstrata do outro lado.
 */
type FinancialGroupLookup = {
  findById(
    organizationId: string,
    id: string,
  ): Promise<{ name: string; type: ChartOfAccountFinancialGroupType } | null>;
};

export class InMemoryChartOfAccountRepository extends ChartOfAccountRepository {
  readonly accounts = new Map<string, ChartOfAccount>();

  constructor(private readonly financialGroups?: FinancialGroupLookup) {
    super();
  }

  findById(organizationId: string, id: string): Promise<ChartOfAccount | null> {
    const account = this.accounts.get(id);
    // Devolve a conta mesmo excluída: quem decide o que fazer com o `deletedAt`
    // é o use case, como no repositório Prisma.
    return Promise.resolve(
      account && account.organizationId === organizationId ? account : null,
    );
  }

  async findByIdWithGroup(
    organizationId: string,
    id: string,
  ): Promise<ChartOfAccountWithGroup | null> {
    const account = await this.findById(organizationId, id);
    return account ? this.toItem(organizationId, account) : null;
  }

  findByName(
    organizationId: string,
    name: string,
  ): Promise<ChartOfAccount | null> {
    const needle = name.trim().toLowerCase();
    const found = this.ofOrganization(organizationId).find(
      (account) => account.name.toLowerCase() === needle,
    );
    return Promise.resolve(found ?? null);
  }

  async findAll(
    organizationId: string,
    criteria: ChartOfAccountListCriteria = {},
  ): Promise<ChartOfAccountWithGroup[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;

    return Promise.all(
      filtered
        .slice(skip, skip + take)
        .map((account) => this.toItem(organizationId, account)),
    );
  }

  count(
    organizationId: string,
    criteria: ChartOfAccountListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(account: ChartOfAccount): Promise<ChartOfAccount> {
    this.accounts.set(account.id, account);
    return Promise.resolve(account);
  }

  clear(): void {
    this.accounts.clear();
  }

  private async toItem(
    organizationId: string,
    account: ChartOfAccount,
  ): Promise<ChartOfAccountWithGroup> {
    const group = await this.financialGroups?.findById(
      organizationId,
      account.financialGroupId,
    );

    return {
      account,
      financialGroupName: group?.name ?? '',
      financialGroupType: group?.type ?? 'despesa',
    };
  }

  private ofOrganization(organizationId: string): ChartOfAccount[] {
    return [...this.accounts.values()].filter(
      (account) => account.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: ChartOfAccountListCriteria,
  ): ChartOfAccount[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'active';

    return this.ofOrganization(organizationId)
      .filter((account) =>
        tab === 'deleted' ? account.deletedAt : !account.deletedAt,
      )
      .filter((account) =>
        search ? account.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}
