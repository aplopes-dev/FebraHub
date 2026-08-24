export interface AppErrorProps {
  internalMessage: string;
  externalMessage: string;
  context: string;
}

export abstract class AppError extends Error {
  readonly internalMessage: string;
  readonly externalMessage: string;
  readonly context: string;

  constructor(props: AppErrorProps) {
    super(props.internalMessage);
    this.name = this.constructor.name;
    this.internalMessage = props.internalMessage;
    this.externalMessage = props.externalMessage;
    this.context = props.context;
  }
}
