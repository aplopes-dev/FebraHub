import type { MunicipalParameters } from '../entities/municipal-parameters.entity';

/// Classe abstrata (não interface) para servir de token de DI — mesmo padrão
/// dos demais repositórios deste serviço.
export abstract class MunicipalParametersRepository {
  abstract findByCityCode(
    cityCodeIbge: string,
  ): Promise<MunicipalParameters | null>;

  /// Upsert por `cityCodeIbge` (único): o cache guarda uma linha por município,
  /// atualizada a cada refresh.
  abstract save(parameters: MunicipalParameters): Promise<MunicipalParameters>;
}
