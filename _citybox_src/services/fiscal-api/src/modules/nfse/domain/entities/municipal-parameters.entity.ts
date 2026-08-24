import { Entity } from '../../../../shared/core/entity';

export type MunicipalParametersProps = {
  cityCodeIbge: string;
  /// Payload como veio do ambiente nacional. Guardado cru de propósito: a
  /// parametrização é definida por ato administrativo do município e evolui
  /// sem aviso — tipar cada campo exigiria migration a cada mudança de regra.
  /// A fronteira de tipagem vive nos getters abaixo, não no schema.
  parameters: Record<string, unknown>;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/// TTL de um dia: parametrização municipal muda por decreto, não por minuto.
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export class MunicipalParameters extends Entity<MunicipalParametersProps> {
  constructor(props: MunicipalParametersProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Completude do payload é responsabilidade do ambiente nacional — aqui só
    // reconstruímos o que foi consultado.
  }

  static create(
    input: Omit<MunicipalParametersProps, 'createdAt' | 'updatedAt'>,
  ): MunicipalParameters {
    const now = new Date();
    return new MunicipalParameters({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
  }

  static with(
    props: MunicipalParametersProps,
    id: string,
  ): MunicipalParameters {
    return new MunicipalParameters(props, id);
  }

  get cityCodeIbge() {
    return this.props.cityCodeIbge;
  }
  get parameters() {
    return this.props.parameters;
  }
  get fetchedAt() {
    return this.props.fetchedAt;
  }

  isStale(now: Date = new Date()): boolean {
    return now.getTime() - this.props.fetchedAt.getTime() >= STALE_AFTER_MS;
  }

  /// Prazo, em dias, para cancelamento direto. Fora dele o cancelamento exige
  /// análise fiscal do município (FR-012) — a decisão sai daqui, nunca de
  /// constante no código.
  ///
  /// Devolve `null` quando o município não parametrizou o prazo: nesse caso o
  /// caso de uso **não** deve assumir um valor, e sim encaminhar para análise
  /// fiscal, que é o caminho conservador.
  get cancelDeadlineDays(): number | null {
    return readNumber(this.props.parameters, [
      'prazoCancelamento',
      'prazoCancelamentoDias',
      'diasCancelamento',
    ]);
  }

  get substitutionDeadlineDays(): number | null {
    return readNumber(this.props.parameters, [
      'prazoSubstituicao',
      'prazoSubstituicaoDias',
      'diasSubstituicao',
    ]);
  }

  /// Município exige identificação do tomador para permitir substituição
  /// (regra do Anexo I). Ausente = não exige.
  get requiresCustomerForSubstitution(): boolean {
    return (
      readBoolean(this.props.parameters, [
        'exigeTomadorSubstituicao',
        'exigeIdentificacaoTomador',
      ]) ?? false
    );
  }
}

/// Leitura tolerante na grafia: o OpenAPI descreve os endpoints mas a forma
/// exata do payload varia por município. Aceitar mais variantes é preferível a
/// silenciosamente ler `undefined` e decidir errado sobre prazo fiscal.
function readNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function readBoolean(
  source: Record<string, unknown>,
  keys: string[],
): boolean | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (/^(true|sim|s|1)$/i.test(value.trim())) return true;
      if (/^(false|nao|não|n|0)$/i.test(value.trim())) return false;
    }
  }
  return null;
}
