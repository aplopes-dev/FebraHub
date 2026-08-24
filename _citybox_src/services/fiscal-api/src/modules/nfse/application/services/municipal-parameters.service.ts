import { Injectable, Logger } from '@nestjs/common';
import { MunicipalParametersRepository } from '../../domain/repositories/municipal-parameters.repository.interface';
import { MunicipalParameters } from '../../domain/entities/municipal-parameters.entity';
import { callSefin } from '../../../../shared/infra/fiscal-http/sefin-http-client';
import { resolveMunicipalParametersEndpoint } from '../../../../shared/infra/fiscal-http/municipal-parameters-config';

/// Resolve a parametrização do município, preferindo o cache e buscando no
/// ambiente nacional quando ele está vencido (research.md §5).
///
/// A parametrização decide prazos fiscais — cancelamento direto vs. análise
/// fiscal (FR-012), e exigência de tomador para substituição. Por isso o
/// comportamento em falha é deliberado: **cache vencido ainda é usado** se a
/// consulta falhar. Bloquear uma emissão porque o serviço de parametrização
/// está fora do ar seria pior do que operar com um prazo de ontem.
@Injectable()
export class MunicipalParametersService {
  private readonly logger = new Logger(MunicipalParametersService.name);

  constructor(private readonly repository: MunicipalParametersRepository) {}

  async resolve(input: {
    cityCodeIbge: string;
    environment: 'HOMOLOGATION' | 'PRODUCTION';
    privateKeyPem: string;
    certificatePem: string;
  }): Promise<MunicipalParameters | null> {
    const cached = await this.repository.findByCityCode(input.cityCodeIbge);
    if (cached && !cached.isStale()) return cached;

    try {
      const response = await callSefin({
        endpoint: resolveMunicipalParametersEndpoint(
          `${input.cityCodeIbge}/convenio`,
          input.environment,
        ),
        method: 'GET',
        privateKeyPem: input.privateKeyPem,
        certificatePem: input.certificatePem,
      });

      const parameters =
        response.json && typeof response.json === 'object'
          ? (response.json as Record<string, unknown>)
          : {};

      return this.repository.save(
        MunicipalParameters.create({
          cityCodeIbge: input.cityCodeIbge,
          parameters,
          fetchedAt: new Date(),
        }),
      );
    } catch (error) {
      // Cache vencido é melhor que nada: o prazo de ontem quase certamente
      // ainda vale, e derrubar a emissão por indisponibilidade de um serviço
      // auxiliar não ajuda ninguém.
      if (cached) {
        this.logger.warn(
          `Parametrização de ${input.cityCodeIbge} indisponível — usando cache de ${cached.fetchedAt.toISOString()}`,
        );
        return cached;
      }

      // Sem cache nenhum, devolver null é honesto: o chamador decide, e a
      // decisão conservadora (encaminhar para análise fiscal) é dele.
      this.logger.warn(
        `Parametrização de ${input.cityCodeIbge} indisponível e sem cache: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
