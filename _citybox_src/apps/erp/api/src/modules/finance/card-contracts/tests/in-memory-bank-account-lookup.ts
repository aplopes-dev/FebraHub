import { BankAccountLookup } from '../domain/repositories/bank-account-lookup.interface';

export class InMemoryBankAccountLookup extends BankAccountLookup {
  private readonly known = new Set<string>();

  /** Helper de teste — registra uma conta existente na organização. */
  add(organizationId: string, id: string): void {
    this.known.add(`${organizationId}:${id}`);
  }

  async exists(organizationId: string, id: string): Promise<boolean> {
    return this.known.has(`${organizationId}:${id}`);
  }
}
