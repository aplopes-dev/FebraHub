import { Entity } from '../../../../shared/core/entity';
import { CompanyValidatorFactory } from '../factories/company-validator.factory';

export const TAX_REGIMES = [
  'SIMPLES_NACIONAL',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;
export type CompanyEnvironment = (typeof ENVIRONMENTS)[number];

export type CompanyAddress = {
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  zipCode: string;
};

export type CompanyProps = {
  storeId: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: TaxRegime;
  cityCodeIbge: string;
  uf: string;
  address: CompanyAddress;
  defaultEnvironment: CompanyEnvironment;
  /// Municipio do emitente aderiu ao Padrao Nacional da NFS-e (FR-020).
  /// Fato cadastral, nao constante de codigo: municipio novo aderir nao pode
  /// exigir deploy, e municipio sair nao pode depender de alguem lembrar de
  /// editar uma lista.
  nationalNfseEnabled: boolean;
  /// CNPJ/CPF do escritorio de contabilidade (`autXML` da NF-e). A Bahia
  /// rejeita a nota sem ele (rejeicao 486).
  accountingOfficeDocument: string | null;
  /// Identificador do CSC (`cIdToken` do QR Code da NFC-e). **Nao e segredo**:
  /// vai em claro dentro do proprio QR Code impresso no cupom.
  cscId: string | null;
  /// ⚠️ O segredo, **sempre cifrado**. A entidade nunca segura o texto claro:
  /// quem cifra e `SetCscUseCase`, e o unico ponto que decifra e
  /// `readCompanyCsc`. Como `Entity.props` e publico, essa separacao e o que
  /// torna "o CSC nao vaza em log" uma propriedade estrutural em vez de uma
  /// regra que alguem precisa lembrar.
  cscTokenEncrypted: string | null;
  /// Justificativas padrão (spec erp/023, N6). `null` até o lojista
  /// preencher; preenchida, exige 15–255 caracteres (validado no
  /// `CompanyZodValidator`). Ainda não usadas automaticamente em
  /// inutilizar/cancelar — não há tela em `erp-web` que chame essas rotas
  /// (limitação declarada no plan.md da feature).
  inutilizationJustification: string | null;
  cancellationJustification: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCompanyInput = Omit<
  CompanyProps,
  | 'active'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultEnvironment'
  | 'nationalNfseEnabled'
  | 'accountingOfficeDocument'
  | 'cscId'
  | 'cscTokenEncrypted'
  | 'inutilizationJustification'
  | 'cancellationJustification'
> & {
  defaultEnvironment?: CompanyEnvironment;
  nationalNfseEnabled?: boolean;
  accountingOfficeDocument?: string | null;
};

export type UpdateCompanyInput = Partial<
  Pick<
    CompanyProps,
    | 'legalName'
    | 'tradeName'
    | 'stateRegistration'
    | 'municipalRegistration'
    | 'taxRegime'
    | 'address'
    | 'defaultEnvironment'
    | 'active'
    // Configurações Gerais (spec erp/012): autXML e adesão à NFS-e nacional são
    // editáveis pelo lojista. Já persistiam via Object.assign; explicitados aqui.
    | 'accountingOfficeDocument'
    | 'nationalNfseEnabled'
    // Justificativas padrão (spec erp/023, N6).
    | 'inutilizationJustification'
    | 'cancellationJustification'
  >
>;

export class Company extends Entity<CompanyProps> {
  constructor(props: CompanyProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    CompanyValidatorFactory.create().validate(this);
  }

  public static create(props: CreateCompanyInput): Company {
    const now = new Date();
    return new Company({
      ...props,
      defaultEnvironment: props.defaultEnvironment ?? 'HOMOLOGATION',
      // Default `false` (mesmo do schema): habilitar NFS-e e ato deliberado de
      // cadastro. Errar para o lado de nao emitir e o lado seguro — o oposto
      // transmitiria para um municipio que talvez nao aceite.
      nationalNfseEnabled: props.nationalNfseEnabled ?? false,
      accountingOfficeDocument: props.accountingOfficeDocument ?? null,
      // CSC nunca vem na criacao: e obtido junto a SEFAZ em passo
      // administrativo posterior, e so bloqueia NFC-e — NF-e e NFS-e seguem.
      cscId: null,
      cscTokenEncrypted: null,
      // Justificativas padrão tambem nascem vazias — preenchidas depois em
      // Configurações gerais (spec erp/023, N6).
      inutilizationJustification: null,
      cancellationJustification: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static with(props: CompanyProps, id: string): Company {
    return new Company(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get cnpj() {
    return this.props.cnpj;
  }
  get legalName() {
    return this.props.legalName;
  }
  get tradeName() {
    return this.props.tradeName;
  }
  get stateRegistration() {
    return this.props.stateRegistration;
  }
  get municipalRegistration() {
    return this.props.municipalRegistration;
  }
  get taxRegime() {
    return this.props.taxRegime;
  }
  get cityCodeIbge() {
    return this.props.cityCodeIbge;
  }
  get uf() {
    return this.props.uf;
  }
  get address() {
    return this.props.address;
  }
  get defaultEnvironment() {
    return this.props.defaultEnvironment;
  }
  get active() {
    return this.props.active;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get nationalNfseEnabled() {
    return this.props.nationalNfseEnabled;
  }
  get accountingOfficeDocument() {
    return this.props.accountingOfficeDocument;
  }

  /// Guarda de FR-020, avaliada ANTES de qualquer transmissao. Substituiu
  /// `isEnabledForNfseIlheus()`, que comparava o codigo IBGE com uma constante.
  public isEnabledForNationalNfse(): boolean {
    return this.props.nationalNfseEnabled;
  }

  get cscId() {
    return this.props.cscId;
  }
  /// Devolve o **cifrado**. Não há getter para o texto claro de propósito:
  /// quem precisa dele chama `readCompanyCsc`, que é o único ponto de
  /// decifragem e é fácil de auditar por busca.
  get cscTokenEncrypted() {
    return this.props.cscTokenEncrypted;
  }

  get inutilizationJustification() {
    return this.props.inutilizationJustification;
  }
  get cancellationJustification() {
    return this.props.cancellationJustification;
  }

  /// Guarda barata para o caminho de emissão decidir antes de fazer trabalho:
  /// recusar por CSC ausente tem de acontecer **antes** de reservar numeração,
  /// senão queima número que depois precisa de inutilização junto à SEFAZ.
  public hasCsc(): boolean {
    return Boolean(this.props.cscId?.trim() && this.props.cscTokenEncrypted);
  }

  /// Grava o CSC. Recebe o token **já cifrado** — ver `SetCscUseCase`.
  ///
  /// Os dois campos andam juntos e são substituídos juntos: na rotação de CSC
  /// (a SEFAZ permite dois códigos ativos), deixar o id antigo com o token novo
  /// produziria hash conferido contra o código errado — cupom autorizado e
  /// inconsultável.
  public setCsc(input: { cscId: string; cscTokenEncrypted: string }): void {
    this.props.cscId = input.cscId;
    this.props.cscTokenEncrypted = input.cscTokenEncrypted;
    this.props.updatedAt = new Date();
    this.validate();
  }

  /// Remove o CSC (spec erp/024, Parte B) — volta o Emitente a
  /// `hasCsc() === false`. Zera os dois campos juntos, mesma razão de
  /// `setCsc`: um sem o outro deixaria um par inconsistente. Idempotente —
  /// chamar sobre um Emitente que já não tem CSC não lança, só reafirma
  /// `null` (ver `ClearCscUseCase`).
  public clearCsc(): void {
    this.props.cscId = null;
    this.props.cscTokenEncrypted = null;
    this.props.updatedAt = new Date();
    this.validate();
  }

  /// BUG-02 (2026-08-13): `UpdateCompanyDto` nasce com `useDefineForClassFields`
  /// (`target: ES2023`) — todo campo declarado existe na instância como
  /// `undefined` mesmo ausente do corpo HTTP. Um `Object.assign` ingênuo
  /// sobrescrevia `legalName`/`tradeName`/`address`/`active` com `undefined`
  /// sempre que o PATCH não os incluía, e a validação seguinte derrubava com
  /// 422 mesmo o `input` sendo só os campos que o lojista quis mudar.
  ///
  /// Só ignora `undefined` ("campo não informado neste PATCH") — `null`
  /// continua um valor válido e limpa o campo de verdade (ex.:
  /// `tradeName: null`), porque os dois significam coisas diferentes.
  public update(input: UpdateCompanyInput): void {
    const present = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as UpdateCompanyInput;
    Object.assign(this.props, present);
    this.props.updatedAt = new Date();
    this.validate();
  }
}
