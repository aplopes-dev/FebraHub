import type {
  CancelDocumentInput,
  CancelDocumentResult,
  ConsultDocumentInput,
  ConsultDocumentResult,
  CorrectionLetterInput,
  CorrectionLetterResult,
  FiscalProvider,
  InutilizeDocumentInput,
  InutilizeDocumentResult,
  IssueDocumentInput,
  IssueDocumentResult,
} from '../../../shared/domain/fiscal-provider.interface';

/// Provider fake para testes — nunca faz chamada externa real. Permite
/// configurar a resposta de `issue`/`consult` por teste (US1 T029-033 usam
/// isso para simular SEFAZ AUTHORIZED/REJECTED/SYNC_REQUIRED sem depender de
/// T038, que ainda não existe/está fora do escopo autorizado).
export class FakeFiscalProvider implements FiscalProvider {
  public issueResult: IssueDocumentResult = {
    status: 'AUTHORIZED',
    protocol: 'fake-protocol-123',
    accessKey: undefined,
    authorizedXml: undefined,
  };
  public consultResult: ConsultDocumentResult = { status: 'AUTHORIZED' };
  public cancelResult: CancelDocumentResult = { status: 'CANCEL_AUTHORIZED' };
  public correctionLetterResult: CorrectionLetterResult = {
    status: 'CORRECTION_LETTER_AUTHORIZED',
    protocol: 'fake-cce-protocol-123',
  };
  public inutilizeResult: InutilizeDocumentResult = {
    status: 'INUTILIZED',
    protocol: 'fake-inut-protocol-123',
  };

  public lastIssueInput: IssueDocumentInput | null = null;
  public issueCallCount = 0;

  /// Ids transmitidos, **na ordem**. Existe para o dreno de contingência: a
  /// ordem de emissão é a invariante que aquela fila protege, e contar chamadas
  /// não a verifica.
  public readonly issuedDocumentIds: string[] = [];

  /// A partir da N-ésima chamada, `issue` **lança** — simula a SEFAZ caindo no
  /// meio do dreno.
  ///
  /// Lança em vez de devolver `REJECTED` de propósito: são coisas diferentes.
  /// Rejeição é resposta do órgão; queda é ausência de resposta, e só a
  /// segunda deve parar a fila. Um dublê que confundisse as duas esconderia
  /// exatamente o comportamento sob teste.
  public failIssueAfter: number | undefined = undefined;

  /// Falha **apenas** nas chamadas cujo índice (base 0) estiver aqui.
  ///
  /// Diferente de `failIssueAfter`, que derruba tudo dali em diante. Existe
  /// para o cenário que de fato ameaça a ordem da fila: a SEFAZ recusa conexão
  /// no cupom `n` mas atenderia o `n+1`. Com "tudo falha depois", pular adiante
  /// não chega a transmitir fora de ordem, e o teste passa mesmo sem a
  /// garantia — foi o que uma mutação revelou.
  public failIssueOnCalls: ReadonlySet<number> = new Set();

  /// `true` = órgão no ar (padrão). `false` = fora. `'throw'` = nem responde.
  ///
  /// Três estados, não dois, porque a decisão de contingência distingue
  /// "respondeu negativamente" de "não respondeu" — um dublê booleano
  /// esconderia essa diferença.
  public serviceStatus: boolean | 'throw' = true;

  checkServiceStatus(
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): Promise<boolean> {
    void environment;
    if (this.serviceStatus === 'throw') {
      return Promise.reject(new Error('SEFAZ inalcançável (simulado)'));
    }
    return Promise.resolve(this.serviceStatus);
  }

  /// Hook opcional executado no início de `issue`, para um teste observar o
  /// estado do mundo no exato momento da transmissão (ex.: conferir que o
  /// documento já está persistido). Existe para evitar monkey-patch do método
  /// nos specs, que produz valores `any` e viola as regras de lint do projeto.
  public onIssue: ((input: IssueDocumentInput) => Promise<void>) | null = null;
  public lastCorrectionLetterInput: CorrectionLetterInput | null = null;
  public lastInutilizeInput: InutilizeDocumentInput | null = null;

  async issue(input: IssueDocumentInput): Promise<IssueDocumentResult> {
    if (
      (this.failIssueAfter !== undefined &&
        this.issueCallCount >= this.failIssueAfter) ||
      this.failIssueOnCalls.has(this.issueCallCount)
    ) {
      throw new Error('SEFAZ indisponível (simulado)');
    }

    this.lastIssueInput = input;
    this.issueCallCount += 1;
    this.issuedDocumentIds.push(input.fiscalDocumentId);
    await this.onIssue?.(input);
    return this.issueResult;
  }

  consult(input: ConsultDocumentInput): Promise<ConsultDocumentResult> {
    void input;
    return Promise.resolve(this.consultResult);
  }

  /// Espelha os providers reais: PRODUCTION sem endpoint configurado e
  /// recusada. Um fake que aceitasse tudo esconderia justamente o bug que este
  /// metodo existe para evitar — foi o que aconteceu com a idempotencia.
  public refuseProduction = true;

  assertEnvironmentAvailable(environment: 'HOMOLOGATION' | 'PRODUCTION'): void {
    if (environment === 'PRODUCTION' && this.refuseProduction) {
      throw new Error('Ambiente PRODUCTION nao configurado');
    }
  }

  /// Fila para cenarios com MAIS DE UM cancelamento na mesma operacao — a
  /// substituicao recusada dispara o cancelamento compensatorio da substituta,
  /// e os dois precisam de desfechos distintos. Vazia: usa `cancelResult`.
  public cancelResults: CancelDocumentResult[] = [];

  cancel(input: CancelDocumentInput): Promise<CancelDocumentResult> {
    void input;
    return Promise.resolve(this.cancelResults.shift() ?? this.cancelResult);
  }

  correctionLetter(
    input: CorrectionLetterInput,
  ): Promise<CorrectionLetterResult> {
    this.lastCorrectionLetterInput = input;
    return Promise.resolve(this.correctionLetterResult);
  }

  inutilize(input: InutilizeDocumentInput): Promise<InutilizeDocumentResult> {
    this.lastInutilizeInput = input;
    return Promise.resolve(this.inutilizeResult);
  }
}
