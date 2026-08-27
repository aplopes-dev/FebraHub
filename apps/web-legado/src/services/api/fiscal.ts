import { api } from './client';

export interface FiscalCertificadoStatus {
  id: string;
  nome: string;
  cnpjTitular: string;
  validoDe: string;
  validoAte: string;
  situacao: string;
  valido: boolean;
}

export interface FiscalStatus {
  ambiente: 'homologacao' | 'producao';
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  regimeTributario: string;
  endereco?: Record<string, string> | null;
  uf: string;
  codigoMunicipio?: string | null;
  telefone?: string | null;
  serieNfce: number;
  nfceHabilitada: boolean;
  temChaveCifra: boolean;
  temCsc: boolean;
  cscId: string | null;
  certificado: FiscalCertificadoStatus | null;
  pendencias: string[];
  prontoParaNfce: boolean;
}

export interface FiscalDocumentoResumo {
  id: string;
  tipoDocumento: 'NFCE' | 'NAO_FISCAL';
  ambiente: string;
  situacao: string;
  vendaId: string | null;
  serie: number | null;
  numero: string | null;
  chaveAcesso: string | null;
  protocolo: string | null;
  valorTotal: string | number;
  clienteNome: string | null;
  emitidoPorNome: string | null;
  codigoErro: string | null;
  mensagemErro: string | null;
  autorizadoEm: string | null;
  criadoEm: string;
}

export interface EmitirResultado {
  documentoId: string;
  tipo: 'fiscal' | 'nao_fiscal';
  situacao?: string;
  chaveAcesso?: string;
  protocolo?: string;
}

export const fiscalStatus = () => api.get<FiscalStatus>('/fiscal/config');

export const fiscalAtualizarConfig = (d: Partial<FiscalStatus> & { endereco?: Record<string, string> }) =>
  api.put<FiscalStatus>('/fiscal/config', d);

export const fiscalDefinirCsc = (cscId: string, cscToken: string) =>
  api.post<FiscalStatus>('/fiscal/config/csc', { cscId, cscToken });

export const fiscalUploadCertificado = (arquivo: File, senha: string, nome?: string) => {
  const fd = new FormData();
  fd.append('arquivo', arquivo);
  fd.append('senha', senha);
  if (nome) fd.append('nome', nome);
  return api.enviarArquivo<FiscalStatus>('/fiscal/config/certificado', fd);
};

export const fiscalEmitir = (vendaId: string, tipo: 'fiscal' | 'nao_fiscal') =>
  api.post<EmitirResultado>('/fiscal/emitir', { vendaId, tipo });

export const fiscalDocumentos = (tipo?: string, situacao?: string) =>
  api.get<FiscalDocumentoResumo[]>('/fiscal/documentos', { parametros: { tipo, situacao } });

/** URL absoluta do comprovante (HTML) para abrir em nova aba e imprimir. */
export function fiscalComprovanteUrl(documentoId: string, formato: 'bobina' | 'a4' = 'bobina'): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');
  return `${base}/fiscal/documentos/${documentoId}/comprovante?formato=${formato}`;
}

/**
 * Abre o comprovante numa nova janela e dispara a impressão. O endpoint devolve
 * HTML pronto (bobina/A4); a janela imprime sozinha ao carregar.
 */
export function imprimirComprovante(documentoId: string, formato: 'bobina' | 'a4' = 'bobina'): void {
  const w = window.open(fiscalComprovanteUrl(documentoId, formato), '_blank');
  if (w) {
    w.addEventListener('load', () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* usuário imprime manualmente */
      }
    });
  }
}
