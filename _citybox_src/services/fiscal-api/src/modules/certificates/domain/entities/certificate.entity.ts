import { Entity } from '../../../../shared/core/entity';

export const CERTIFICATE_STATUSES = [
  'PENDING_VALIDATION',
  'VALID',
  'EXPIRED',
  'INVALID',
  'REVOKED',
] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export type CertificateProps = {
  companyId: string;
  type: string;
  name: string | null;
  encryptedPfxObjectKey: string;
  encryptedPassword: string;
  subjectCnpj: string;
  validFrom: Date;
  validUntil: Date;
  status: CertificateStatus;
  createdAt: Date;
};

/// Fluxo de escrita (upload, validação do .pfx, extração de chave/CNPJ)
/// implementado em US3 (`application/use-cases/upload-certificate`) — T014
/// (toolkit de assinatura/criptografia) foi aprovado e está completo.
export class Certificate extends Entity<CertificateProps> {
  constructor(props: CertificateProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de forma (PKCS#12 válido, senha correta, CNPJ compatível,
    // não expirado) é responsabilidade de `parsePkcs12` +
    // `UploadCertificateUseCase` (US3) — aqui a entidade apenas reconstrói
    // dados já validados no cadastro.
  }

  public static with(props: CertificateProps, id: string): Certificate {
    return new Certificate(props, id);
  }

  /// Cria um novo Certificate a partir de um `.pfx` já validado (US3) — o
  /// chamador (`UploadCertificateUseCase`) já confirmou PKCS#12 válido,
  /// senha correta, CNPJ compatível com o Emitente e não expirado antes de
  /// chegar aqui, então `status` sempre nasce `VALID`.
  public static create(
    props: Omit<CertificateProps, 'status' | 'createdAt'>,
  ): Certificate {
    return new Certificate({
      ...props,
      status: 'VALID',
      createdAt: new Date(),
    });
  }

  get companyId() {
    return this.props.companyId;
  }
  get type() {
    return this.props.type;
  }
  get name() {
    return this.props.name;
  }
  get subjectCnpj() {
    return this.props.subjectCnpj;
  }
  get validFrom() {
    return this.props.validFrom;
  }
  get validUntil() {
    return this.props.validUntil;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  /// Chave criptografada no MinIO — só o toolkit de assinatura (T014) pode
  /// decifrar/usar; nunca deve ser exposta em nenhuma resposta HTTP (FR-007).
  get encryptedPfxObjectKey() {
    return this.props.encryptedPfxObjectKey;
  }
  get encryptedPassword() {
    return this.props.encryptedPassword;
  }

  public isValidNow(): boolean {
    const now = new Date();
    return (
      this.props.status === 'VALID' &&
      this.props.validFrom <= now &&
      this.props.validUntil >= now
    );
  }

  public daysUntilExpiration(): number {
    const diffMs = this.props.validUntil.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
