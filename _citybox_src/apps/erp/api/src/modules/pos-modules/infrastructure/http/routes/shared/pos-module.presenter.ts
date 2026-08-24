import {
  POS_MODULE_PROFILE_NAMES,
  type PosModuleDefaults,
} from '../../../../domain/entities/pos-module-defaults.entity';
import {
  POS_CORE_MODULE_IDS,
  POS_CONFIGURABLE_OPTIONAL_MODULES,
} from '../../../../domain/catalog/pos-module.catalog';
import type { TerminalModulesResult } from '../../../../application/dtos/pos-module.dto';

export class PosModulePresenter {
  /**
   * O padrão da loja **mais o catálogo**.
   *
   * A tela precisa de rótulo e descrição para desenhar as chaves, e buscá-los
   * numa segunda rota criaria dois lugares para o catálogo divergir. Sai junto.
   * `optional` omite mesas/comandas enquanto estiverem em
   * `POS_TEMPORARILY_DISABLED_MODULE_IDS` — switch sem efeito enganaria.
   */
  static toDefaultsHttp(defaults: PosModuleDefaults) {
    return {
      data: {
        profileName: defaults.profileName,
        modules: defaults.modules,
        updatedAt: defaults.updatedAt.toISOString(),
        catalog: {
          optional: POS_CONFIGURABLE_OPTIONAL_MODULES,
          /** Só os ids: a tela não desenha o núcleo, só precisa não oferecê-lo. */
          coreIds: POS_CORE_MODULE_IDS,
          profiles: POS_MODULE_PROFILE_NAMES,
        },
      },
    };
  }

  static toTerminalHttp(result: TerminalModulesResult) {
    return {
      data: {
        terminalId: result.terminalId,
        modules: result.resolved,
        inheritsDefaults: result.inheritsDefaults,
      },
    };
  }

  /** O que o PDV lê: só o resolvido, sem catálogo nem procedência. */
  static toDeviceHttp(result: TerminalModulesResult) {
    return {
      data: {
        modules: result.resolved,
      },
    };
  }
}
