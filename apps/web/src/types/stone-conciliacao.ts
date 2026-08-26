/** Uma transação de cartão da maquininha, importada do arquivo de conciliação Stone. */
export interface StoneConcTransacao {
  id: string;
  stoneCode: string;
  referenceDate: string;
  acquirerTransactionKey: string;
  initiatorTransactionKey: string | null;
  authorizationDateTime: string | null;
  captureDateTime: string | null;
  accountType: string | null; // 1 credito | 2 debito
  brandId: string | null;
  brandNome: string | null;
  cardNumber: string | null;
  numberOfInstallments: number;
  authorizationCode: string | null;
  poiSerialNumber: string | null;
  grossAmount: number | string;
  netAmount: number | string;
  feeAmount: number | string;
  previsionPaymentDate: string | null;
  cancelado: boolean;
}

export interface StoneConcLista {
  total: number;
  somaBruto: number | string;
  somaLiquido: number | string;
  somaTaxas: number | string;
  itens: StoneConcTransacao[];
}

export interface StoneConcImport {
  id: string;
  stoneCode: string;
  referenceDate: string;
  status: string; // ok | vazio | erro
  quantidade: number;
  erro: string | null;
  criadoEm: string;
}

export interface StoneConcStatus {
  configurado: boolean;
  stoneCode: string | null;
}
