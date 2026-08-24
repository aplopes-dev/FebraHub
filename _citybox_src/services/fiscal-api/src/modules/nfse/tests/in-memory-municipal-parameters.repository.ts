import { MunicipalParametersRepository } from '../domain/repositories/municipal-parameters.repository.interface';
import { MunicipalParameters } from '../domain/entities/municipal-parameters.entity';

export class InMemoryMunicipalParametersRepository extends MunicipalParametersRepository {
  private readonly byCity = new Map<string, MunicipalParameters>();

  findByCityCode(cityCodeIbge: string): Promise<MunicipalParameters | null> {
    return Promise.resolve(this.byCity.get(cityCodeIbge) ?? null);
  }

  save(parameters: MunicipalParameters): Promise<MunicipalParameters> {
    // Reconstrói em vez de guardar a instância recebida — mesma correção
    // aplicada ao fake de FiscalDocument, onde guardar por referência fez o
    // fake se comportar como um banco que nunca perde nada.
    const stored = MunicipalParameters.with(
      { ...parameters.props },
      parameters.id,
    );
    this.byCity.set(stored.cityCodeIbge, stored);
    return Promise.resolve(stored);
  }
}
