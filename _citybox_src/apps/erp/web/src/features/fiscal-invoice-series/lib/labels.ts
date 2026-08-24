import type { FiscalDocumentType } from "../api/fiscal-sequence.dto";

/** Rótulo de domínio (não o nome do enum) para a coluna/leitura. */
export const DOCUMENT_TYPE_LABEL: Record<FiscalDocumentType, string> = {
  NFE: "NF-e",
  NFCE: "NFC-e",
  NFSE: "NFS-e",
};

/** Rótulo "Para venda de" do formulário (espelha a referência). */
export const DOCUMENT_TYPE_SALE_LABEL: Record<FiscalDocumentType, string> = {
  NFE: "Produto - NF-e",
  NFCE: "Produto - NFC-e",
  NFSE: "Serviço",
};

export const DOCUMENT_TYPE_OPTIONS: {
  value: FiscalDocumentType;
  label: string;
}[] = [
  { value: "NFE", label: DOCUMENT_TYPE_SALE_LABEL.NFE },
  { value: "NFCE", label: DOCUMENT_TYPE_SALE_LABEL.NFCE },
  { value: "NFSE", label: DOCUMENT_TYPE_SALE_LABEL.NFSE },
];
