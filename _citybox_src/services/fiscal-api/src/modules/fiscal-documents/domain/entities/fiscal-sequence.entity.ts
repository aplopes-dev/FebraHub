import { Entity } from '../../../../shared/core/entity';
import type {
  FiscalDocumentEnvironment,
  FiscalDocumentType,
} from './fiscal-document.entity';

export type FiscalSequenceProps = {
  companyId: string;
  documentType: FiscalDocumentType;
  series: string;
  currentNumber: bigint;
  environment: FiscalDocumentEnvironment;
  active: boolean;
};

/// Controle de número/série por Emitente + tipo + ambiente — pré-requisito
/// técnico de FR-001/FR-002 (reserva de numeração), não citado como entidade
/// de negócio no spec, mas necessário para emitir NF-e/NFS-e válidas.
export class FiscalSequence extends Entity<FiscalSequenceProps> {
  constructor(props: FiscalSequenceProps, id: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.currentNumber < 0n) {
      throw new Error('currentNumber não pode ser negativo');
    }
  }

  public static with(props: FiscalSequenceProps, id: string): FiscalSequence {
    return new FiscalSequence(props, id);
  }

  get companyId() {
    return this.props.companyId;
  }
  get documentType() {
    return this.props.documentType;
  }
  get series() {
    return this.props.series;
  }
  get currentNumber() {
    return this.props.currentNumber;
  }
  get environment() {
    return this.props.environment;
  }
  get active() {
    return this.props.active;
  }

  /// Reserva o próximo número da sequência (usado pelo IssueNfeUseCase/
  /// IssueNfseUseCase em US1/US2, dentro de uma transação Prisma).
  public reserveNext(): bigint {
    this.props.currentNumber += 1n;
    return this.props.currentNumber;
  }
}
