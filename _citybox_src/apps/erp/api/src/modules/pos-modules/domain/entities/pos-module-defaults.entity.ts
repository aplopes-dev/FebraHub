import { Entity } from '../../../../shared/core/entity';
import { POS_OPTIONAL_MODULE_IDS } from '../catalog/pos-module.catalog';
import {
  sanitizeModuleStates,
  type PosModuleStateMap,
} from '../services/resolve-terminal-modules';

export type PosModuleDefaultsProps = {
  organizationId: string;
  profileName: string | null;
  modules: PosModuleStateMap;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Perfis prontos, para o gerente não precisar saber de cor quais seis módulos
 * um restaurante usa.
 *
 * ⚠️ **Espelho de `segment_profiles.dart` no PDV.** Lá eles existem como
 * fallback de primeiro boot sem rede; aqui são o que o backoffice oferece. Se
 * divergirem, um terminal recém-instalado mostraria um conjunto e passaria a
 * mostrar outro na primeira sincronização.
 */
export const POS_MODULE_PROFILES: Record<string, PosModuleStateMap> = {
  Restaurante: {
    // tables/tabs: desligados até existirem sync ERP + UX (force em resolve).
    tables: 'disabled',
    tabs: 'disabled',
    service: 'available',
    delivery: 'available',
    delivery_orders: 'available',
    price_check: 'disabled',
    refund: 'disabled',
    credit: 'disabled',
  },
  'Lanchonete com delivery': {
    tables: 'disabled',
    tabs: 'disabled',
    service: 'available',
    delivery: 'available',
    delivery_orders: 'available',
    price_check: 'disabled',
    refund: 'disabled',
    credit: 'disabled',
  },
  Loja: {
    tables: 'disabled',
    tabs: 'disabled',
    service: 'disabled',
    delivery: 'disabled',
    delivery_orders: 'disabled',
    price_check: 'available',
    refund: 'disabled',
    credit: 'disabled',
  },
  Mercado: {
    tables: 'disabled',
    tabs: 'disabled',
    service: 'disabled',
    delivery: 'disabled',
    delivery_orders: 'disabled',
    price_check: 'available',
    refund: 'disabled',
    credit: 'disabled',
  },
};

export const POS_MODULE_PROFILE_NAMES = Object.keys(POS_MODULE_PROFILES);

/**
 * O que uma organização que nunca abriu a tela recebe.
 *
 * Opcionais ligados por padrão (food + varejo no mesmo sistema), **exceto**
 * mesas/comandas — ainda sem implementação ponta a ponta; ver
 * `POS_TEMPORARILY_DISABLED_MODULE_IDS`.
 */
export const POS_MODULE_DEFAULTS_NEUTRAL: PosModuleStateMap =
  Object.fromEntries(
    POS_OPTIONAL_MODULE_IDS.map((id) => [
      id,
      id === 'tables' || id === 'tabs'
        ? ('disabled' as const)
        : ('available' as const),
    ]),
  );

export type UpdatePosModuleDefaultsInput = {
  profileName?: string | null;
  modules?: Record<string, unknown>;
};

/** Padrão de módulos da organização — ver o comentário do model no schema. */
export class PosModuleDefaults extends Entity<PosModuleDefaultsProps> {
  constructor(props: PosModuleDefaultsProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Sem validador Zod: o conjunto de estados válidos já é garantido por
    // `sanitizeModuleStates`, que roda em toda entrada. Um schema aqui
    // duplicaria a mesma checagem num segundo lugar.
  }

  public static createDefault(
    organizationId: string,
    id?: string,
  ): PosModuleDefaults {
    const now = new Date();
    return new PosModuleDefaults(
      {
        organizationId,
        profileName: null,
        modules: { ...POS_MODULE_DEFAULTS_NEUTRAL },
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(
    props: PosModuleDefaultsProps,
    id: string,
  ): PosModuleDefaults {
    return new PosModuleDefaults(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get profileName() {
    return this.props.profileName;
  }
  get modules() {
    return this.props.modules;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /** PATCH: só o que vier em `input` muda. */
  update(input: UpdatePosModuleDefaultsInput): PosModuleDefaults {
    const modules =
      input.modules === undefined
        ? this.props.modules
        : sanitizeModuleStates(input.modules);

    const profileName =
      input.profileName === undefined
        ? this.props.profileName
        : input.profileName;

    return PosModuleDefaults.with(
      {
        ...this.props,
        // O nome do perfil **não sobrevive** a um ajuste que o descaracterize.
        // Guardar "Loja" num conjunto que já não é Loja seria um rótulo que
        // mente — e a tela mostraria o perfil selecionado com as chaves de
        // outra coisa.
        profileName: matchesProfile(modules, profileName) ? profileName : null,
        modules,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Aplica um perfil pronto.
   *
   * Substitui o conjunto inteiro, não mescla: "aplicar Loja" tem que produzir
   * exatamente Loja, senão o gerente que aplicou o perfil errado antes ficaria
   * com um híbrido que nenhum dos dois explica.
   */
  applyProfile(profileName: string): PosModuleDefaults {
    const profile = POS_MODULE_PROFILES[profileName];
    if (!profile) return this;

    return PosModuleDefaults.with(
      {
        ...this.props,
        profileName,
        modules: { ...profile },
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

/**
 * `true` se o conjunto ainda é exatamente o perfil nomeado.
 *
 * Comparação por igualdade de mapa, não por subconjunto: um perfil com um
 * módulo a mais ligado deixou de ser aquele perfil.
 */
function matchesProfile(
  modules: PosModuleStateMap,
  profileName: string | null,
): boolean {
  if (!profileName) return false;
  const profile = POS_MODULE_PROFILES[profileName];
  if (!profile) return false;

  return POS_OPTIONAL_MODULE_IDS.every(
    (id) => (modules[id] ?? 'available') === (profile[id] ?? 'available'),
  );
}
