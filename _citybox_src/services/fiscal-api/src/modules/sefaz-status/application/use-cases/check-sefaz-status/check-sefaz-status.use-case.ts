import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { StatusCheckRepository } from '../../../domain/status-check.repository';
import { StatusProbe } from '../../../domain/status-probe';
import { SefazBaStatusProbe } from '../../../infrastructure/sefaz-ba-status.probe';
import { NfseStatusProbe } from '../../../infrastructure/nfse-status.probe';
import type { StatusModel } from '../../../domain/service-status';
import { deriveOverallVerdict } from '../../../domain/service-status';
import type {
  ModelStatus,
  StatusResponse,
} from '../../../domain/status-response';
import type {
  StatusCheck,
  StatusWindowKey,
} from '../../../domain/status-check.entity';
import {
  ageSeconds,
  isFresh,
  nextCheckAt,
} from '../../../domain/status-window';
import { StatusLocalFailureError } from '../../../domain/errors/status-local-failure.error';

const ALL_MODELS: readonly StatusModel[] = ['NFE', 'NFCE', 'NFSE'];

export type CheckSefazStatusInput = {
  companyId: string;
  user: AuthenticatedUser;
  /// Filtro opcional (FR-001a). Ausente = todos os três.
  models?: StatusModel[];
  environment?: 'HOMOLOGATION' | 'PRODUCTION';
};

/// FR-001 — responde "o órgão está atendendo?" para uma empresa, em uma única
/// consulta, cobrindo por padrão os três modelos. Sem emitir nem numerar nada
/// (FR-012).
@Injectable()
export class CheckSefazStatusUseCase {
  constructor(
    private readonly companyAccessPolicy: CompanyAccessPolicy,
    private readonly statusCheckRepository: StatusCheckRepository,
    private readonly sefazProbe: SefazBaStatusProbe,
    private readonly nfseProbe: NfseStatusProbe,
  ) {}

  async execute(input: CheckSefazStatusInput): Promise<StatusResponse> {
    const environment = input.environment ?? 'HOMOLOGATION';

    // Tenant primeiro: `companyId` é afirmação do chamador; quem decide é a
    // política, a partir do `sub` do JWT. 404 (não 403) — a existência de
    // emissor alheio já é informação (mesmo padrão de IssueNfceUseCase).
    if (
      !(await this.companyAccessPolicy.canActFor(input.companyId, input.user))
    ) {
      throw new CompanyNotFoundError(
        CheckSefazStatusUseCase.name,
        input.companyId,
      );
    }

    const models = this.resolveModels(input.models);

    // FR-009: recusa PRODUCTION não configurado ANTES de qualquer contato.
    for (const model of models) {
      this.probeFor(model).assertEnvironmentAvailable(model, environment);
    }

    // FR-008a / R5: contato paralelo, um órgão inalcançável não derruba os
    // demais. `allSettled` garante que uma exceção inesperada em um modelo não
    // aborte a consulta inteira.
    const settled = await Promise.allSettled(
      models.map((model) =>
        this.resolveModel(input.companyId, model, environment),
      ),
    );

    const results: ModelStatus[] = settled.map((outcome, index) =>
      outcome.status === 'fulfilled'
        ? outcome.value
        : this.unreachableFallback(models[index]),
    );

    // FR-010: se TODOS deram falha local (tipicamente certificado), a consulta
    // inteira falhou por causa nossa → 422. Falha parcial responde 200 com o
    // detalhe por modelo.
    if (
      results.length > 0 &&
      results.every((r) => r.status === 'LOCAL_ERROR')
    ) {
      throw new StatusLocalFailureError(
        CheckSefazStatusUseCase.name,
        results[0].authorityMessage ?? 'certificado indisponível',
      );
    }

    return {
      overall: deriveOverallVerdict(results.map((r) => r.status)),
      checkedForCompanyId: input.companyId,
      environment,
      results,
    };
  }

  private resolveModels(requested?: StatusModel[]): StatusModel[] {
    if (!requested || requested.length === 0) return [...ALL_MODELS];
    // Preserva a ordem canônica e remove duplicados.
    return ALL_MODELS.filter((model) => requested.includes(model));
  }

  private probeFor(model: StatusModel): StatusProbe {
    return model === 'NFSE' ? this.nfseProbe : this.sefazProbe;
  }

  /// Caminho de um modelo: serve do cache se fresco (FR-007); senão, sob lock
  /// (FR-007b), re-checa e contata o órgão uma única vez.
  private async resolveModel(
    companyId: string,
    model: StatusModel,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): Promise<ModelStatus> {
    const key: StatusWindowKey = { companyId, model, environment };

    const cached = await this.statusCheckRepository.findLatest(key);
    if (cached && isFresh(cached.checkedAt, new Date())) {
      return this.toModelStatus(cached);
    }

    const saved = await this.statusCheckRepository.withWindowLock(
      key,
      async (locked) => {
        // Double-check sob o lock: outro contato pode ter acabado de gravar.
        const fresh = await locked.findLatest();
        if (fresh && isFresh(fresh.checkedAt, new Date())) return fresh;

        const result = await this.probeFor(model).probe({
          companyId,
          model,
          environment,
        });
        return locked.save({
          companyId,
          model,
          environment,
          status: result.status,
          authority: result.authority,
          authorityMessage: result.authorityMessage,
          expectedReturnAt: result.expectedReturnAt,
          checkedAt: new Date(),
        });
      },
    );

    return this.toModelStatus(saved);
  }

  private toModelStatus(check: StatusCheck): ModelStatus {
    const now = new Date();
    return {
      model: check.model,
      authority: check.authority,
      status: check.status,
      authorityMessage: check.authorityMessage,
      expectedReturnAt: check.expectedReturnAt,
      checkedAt: check.checkedAt,
      ageSeconds: ageSeconds(check.checkedAt, now),
      // UNVERIFIABLE não tem verificação futura agendada — não há o que checar.
      nextCheckAt:
        check.status === 'UNVERIFIABLE' ? null : nextCheckAt(check.checkedAt),
    };
  }

  /// Só ocorre se o probe violar seu contrato (deveria devolver UNREACHABLE, não
  /// lançar). Mantém FR-008a de pé mesmo assim.
  private unreachableFallback(model: StatusModel): ModelStatus {
    const now = new Date();
    return {
      model,
      authority:
        model === 'NFCE'
          ? 'SVRS'
          : model === 'NFSE'
            ? 'SEFIN-NACIONAL'
            : 'SEFAZ-BA',
      status: 'UNREACHABLE',
      authorityMessage: null,
      expectedReturnAt: null,
      checkedAt: now,
      ageSeconds: 0,
      nextCheckAt: nextCheckAt(now),
    };
  }
}
