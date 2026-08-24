import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDefaultTaxes } from '../../../domain/entities/fiscal-default-taxes.entity';
import { FiscalDefaultTaxesRepository } from '../../../domain/repositories/fiscal-default-taxes.repository.interface';
import type { GetFiscalDefaultTaxesDto } from '../../dtos/fiscal-defaults.dto';

/**
 * Padrões fiscais da organização, criando o padrão vazio na primeira leitura.
 * **Nunca devolve 404** — a tela e a herança em fiscal-parameters sempre têm um
 * objeto de padrão para ler.
 */
@Injectable()
export class GetFiscalDefaultTaxesUseCase implements IUseCase<
  GetFiscalDefaultTaxesDto,
  FiscalDefaultTaxes
> {
  constructor(private readonly repository: FiscalDefaultTaxesRepository) {}

  async execute(input: GetFiscalDefaultTaxesDto): Promise<FiscalDefaultTaxes> {
    const existing = await this.repository.findByOrganization(
      input.organizationId,
    );
    if (existing) return existing;

    return this.repository.save(
      FiscalDefaultTaxes.createDefault(input.organizationId),
    );
  }
}
