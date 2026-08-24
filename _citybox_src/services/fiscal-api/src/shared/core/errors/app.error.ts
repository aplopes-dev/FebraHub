export interface AppErrorProps {
  internalMessage: string;
  externalMessage: string;
  context: string;
  /// Código exposto ao cliente no lugar do nome da classe. Existe para
  /// rejeições cujo código é definido por um órgão externo (ex.: `E1313` do
  /// Sistema Nacional da NFS-e) — quem consome a API precisa do código
  /// oficial, não do nome da nossa classe de erro.
  externalCode?: string;
}

export abstract class AppError extends Error {
  readonly internalMessage: string;
  readonly externalMessage: string;
  readonly context: string;
  readonly externalCode: string;

  constructor(props: AppErrorProps) {
    super(props.internalMessage);
    this.name = this.constructor.name;
    this.internalMessage = props.internalMessage;
    this.externalMessage = props.externalMessage;
    this.context = props.context;
    this.externalCode = props.externalCode ?? this.constructor.name;
  }
}
