import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosFiscalSettings } from '../../../domain/entities/pos-fiscal-settings.entity';
import { PosFiscalSettingsRepository } from '../../../domain/repositories/pos-fiscal-settings.repository.interface';
import type { GetPosFiscalSettingsDto } from '../../dtos/pos-fiscal-settings.dto';

/**
 * Configuração fiscal do PDV da organização, criando a padrão (não configurada)
 * na primeira leitura. **Nunca devolve 404** — assim tela e PDV não inventam
 * fallbacks divergentes.
 */
@Injectable()
export class GetPosFiscalSettingsUseCase implements IUseCase<
  GetPosFiscalSettingsDto,
  PosFiscalSettings
> {
  constructor(private readonly repository: PosFiscalSettingsRepository) {}

  async execute(input: GetPosFiscalSettingsDto): Promise<PosFiscalSettings> {
    const existing = await this.repository.findByOrganization(
      input.organizationId,
    );
    if (existing) return existing;

    return this.repository.save(
      PosFiscalSettings.createDefault(input.organizationId),
    );
  }
}
