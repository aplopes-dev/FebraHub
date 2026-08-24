export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'access'
  | 'approve'
  /** Pagar despesa / receber receita (caixa). */
  | 'settle'
  /** Receber com data futura. */
  | 'settleFuture'
  /** Receber com data retroativa. */
  | 'settleRetroactive'
  /** Visualizar Funil de Agendamento. */
  | 'readScheduleFunnel'
  /** Visualizar Funil de Venda. */
  | 'readSalesFunnel'
  /** Visualizar funil personalizado. */
  | 'readCustomFunnel'
  /** Visualizar funis criados pela clínica. */
  | 'readClinicFunnels';
