import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Optional } from '../../../../shared/core/types/optional.type';

/** Documento fiscal ao qual a informação adicional se aplica (spec erp/017). */
export const FISCAL_DOCUMENT_TYPES = ['NFE', 'NFCE', 'NFSE'] as const;
export type FiscalDocumentType = (typeof FISCAL_DOCUMENT_TYPES)[number];

/**
 * Destino do texto no XML. Campos e tetos distintos:
 * - `INF_CPL`: interesse do contribuinte (NF-e/NFC-e `infAdic/infCpl`; NFS-e
 *   `serv/infoCompl/xInfComp`).
 * - `INF_AD_FISCO`: interesse do fisco (só NF-e/NFC-e `infAdic/infAdFisco`).
 */
export const ADDITIONAL_INFO_TARGETS = ['INF_CPL', 'INF_AD_FISCO'] as const;
export type AdditionalInfoTarget = (typeof ADDITIONAL_INFO_TARGETS)[number];

// Tetos do XSD, por (documento, destino) — plan D8/D10.
/** NF-e/NFC-e `infCpl` (`TString`). */
const INF_CPL_MAX_NFE = 5000;
/** NF-e/NFC-e `infAdFisco` (`TString`). */
const INF_AD_FISCO_MAX_NFE = 2000;
/** NFS-e `xInfComp` (`TSDescInfCompl`) — análogo do `infCpl`. */
const X_INF_COMP_MAX_NFSE = 2000;

/** Nome/apelido do cadastro (limite de UI, não do fisco). */
const NAME_MAX = 120;

/**
 * Caracteres de controle C0 ilegais em XML 1.0 (§2.2): permitidos só TAB (9),
 * LF (10) e CR (13); ilegais 0–8, 11, 12, 14–31. O texto entra num documento
 * fiscal transmitido — um caractere desses (que sobrevive a colar de PDF/Word)
 * passaria pela validação de tamanho e sairia no XML, deixando-o mal-formado e
 * sujeito a recusa da SEFAZ/Sefin. Recusa no cadastro (a fiscal-api também barra
 * antes de transmitir). Por código de caractere para não esbarrar no lint
 * `no-control-regex`.
 */
function hasIllegalXmlControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31)) {
      return true;
    }
  }
  return false;
}

/**
 * ⚠️ A NFS-e nacional **não** tem `infAdFisco` (o `DPS_v1.01.xsd` não possui o
 * campo — plan D10): para `NFSE` só o destino `INF_CPL` existe.
 */
export function isTargetAvailable(
  documentType: FiscalDocumentType,
  target: AdditionalInfoTarget,
): boolean {
  if (documentType === 'NFSE' && target === 'INF_AD_FISCO') return false;
  return true;
}

/** Teto do XSD (nº de caracteres) para o par (documento, destino). */
export function maxLengthFor(
  documentType: FiscalDocumentType,
  target: AdditionalInfoTarget,
): number {
  if (documentType === 'NFSE') return X_INF_COMP_MAX_NFSE;
  return target === 'INF_AD_FISCO' ? INF_AD_FISCO_MAX_NFE : INF_CPL_MAX_NFE;
}

export type FiscalAdditionalInfoProps = {
  organizationId: string;
  name: string;
  text: string;
  documentType: FiscalDocumentType;
  target: AdditionalInfoTarget;
  createdAt: Date;
  updatedAt: Date;
};

type CreateProps = Optional<
  FiscalAdditionalInfoProps,
  'createdAt' | 'updatedAt'
>;

export type UpdateFiscalAdditionalInfoInput = {
  name: string;
  text: string;
  target: AdditionalInfoTarget;
};

/**
 * Informação adicional da nota fiscal (spec erp/017). Texto fixo que o emissor
 * concatena por (documentType, target) e injeta no XML transmitido. O
 * `documentType` é imutável após a criação (troca o limite e a aba a que
 * pertence — vira outro cadastro).
 */
export class FiscalAdditionalInfo extends Entity<FiscalAdditionalInfoProps> {
  constructor(props: FiscalAdditionalInfoProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!FISCAL_DOCUMENT_TYPES.includes(this.props.documentType)) {
      throw new ValidatorDomainError({
        internalMessage: `documentType inválido: ${this.props.documentType}`,
        externalMessage: 'Tipo de documento inválido.',
        context: FiscalAdditionalInfo.name,
      });
    }
    if (!ADDITIONAL_INFO_TARGETS.includes(this.props.target)) {
      throw new ValidatorDomainError({
        internalMessage: `target inválido: ${this.props.target}`,
        externalMessage: 'Destino inválido.',
        context: FiscalAdditionalInfo.name,
      });
    }
    // Regra central (plan D10): NFS-e não tem campo do fisco.
    if (!isTargetAvailable(this.props.documentType, this.props.target)) {
      throw new ValidatorDomainError({
        internalMessage: `target INF_AD_FISCO indisponível para NFSE`,
        externalMessage:
          'A NFS-e não possui campo de informação ao fisco; use o campo do contribuinte.',
        context: FiscalAdditionalInfo.name,
      });
    }
    if (this.props.name.trim().length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'name vazio',
        externalMessage: 'Informe um nome para a informação adicional.',
        context: FiscalAdditionalInfo.name,
      });
    }
    if (this.props.name.length > NAME_MAX) {
      throw new ValidatorDomainError({
        internalMessage: `name excede ${NAME_MAX}`,
        externalMessage: `O nome não pode passar de ${NAME_MAX} caracteres.`,
        context: FiscalAdditionalInfo.name,
      });
    }
    const text = this.props.text.trim();
    if (text.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'text vazio',
        externalMessage: 'Informe o texto da informação adicional.',
        context: FiscalAdditionalInfo.name,
      });
    }
    // Um único registro já não pode passar do teto do campo — a concatenação de
    // vários é validada no resolvedor, mas nem um sozinho pode estourar.
    const max = maxLengthFor(this.props.documentType, this.props.target);
    if (text.length > max) {
      throw new ValidatorDomainError({
        internalMessage: `text excede o limite de ${max} do XSD`,
        externalMessage: `O texto não pode passar de ${max} caracteres para este destino.`,
        context: FiscalAdditionalInfo.name,
      });
    }
    // O texto entra num documento fiscal transmitido — caractere de controle
    // ilegal em XML 1.0 deixaria o XML mal-formado. Recusa aqui (a fiscal-api
    // reforça antes de transmitir).
    if (hasIllegalXmlControlChar(text)) {
      throw new ValidatorDomainError({
        internalMessage:
          'text contém caractere de controle inválido para XML 1.0',
        externalMessage:
          'O texto contém um caractere inválido (de controle). Remova-o e tente novamente.',
        context: FiscalAdditionalInfo.name,
      });
    }
  }

  static create(props: CreateProps): FiscalAdditionalInfo {
    const now = new Date();
    return new FiscalAdditionalInfo({
      ...props,
      name: props.name.trim(),
      text: props.text.trim(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static with(
    props: FiscalAdditionalInfoProps,
    id: string,
  ): FiscalAdditionalInfo {
    return new FiscalAdditionalInfo(props, id);
  }

  update(input: UpdateFiscalAdditionalInfoInput): FiscalAdditionalInfo {
    // `documentType` não muda (imutável): trocá-lo seria outro cadastro.
    return new FiscalAdditionalInfo(
      {
        ...this.props,
        name: input.name.trim(),
        text: input.text.trim(),
        target: input.target,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
  get name(): string {
    return this.props.name;
  }
  get text(): string {
    return this.props.text;
  }
  get documentType(): FiscalDocumentType {
    return this.props.documentType;
  }
  get target(): AdditionalInfoTarget {
    return this.props.target;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
