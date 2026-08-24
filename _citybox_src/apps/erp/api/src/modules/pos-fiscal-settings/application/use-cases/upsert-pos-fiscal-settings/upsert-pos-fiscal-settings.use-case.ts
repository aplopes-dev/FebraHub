import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosFiscalSettings } from '../../../domain/entities/pos-fiscal-settings.entity';
import { PosFiscalSettingsRepository } from '../../../domain/repositories/pos-fiscal-settings.repository.interface';
import type { UpsertPosFiscalSettingsDto } from '../../dtos/pos-fiscal-settings.dto';

/**
 * Grava o modelo que o PDV emite. "Upsert": cria com o default se ainda não
 * existir — do ponto de vista da tela, a configuração sempre existiu.
 *
 * ⚠️ O bloqueio de "Modelo 65 sem CSC" NÃO é feito aqui: o CSC vive na
 * fiscal-api, que o erp-api não conhece. A guarda vive na tela (spec erp/013, D3).
 */
@Injectable()
export class UpsertPosFiscalSettingsUseCase implements IUseCase<
  UpsertPosFiscalSettingsDto,
  PosFiscalSettings
> {
  constructor(private readonly repository: PosFiscalSettingsRepository) {}

  async execute(input: UpsertPosFiscalSettingsDto): Promise<PosFiscalSettings> {
    const current =
      (await this.repository.findByOrganization(input.organizationId)) ??
      PosFiscalSettings.createDefault(input.organizationId);

    return this.repository.save(
      current.update({
        posDocumentModel: input.posDocumentModel,
        updatedByUserId: input.updatedByUserId,
      }),
    );
  }
}
