import { api } from './client';
import type { FinCadastros, FinContaSaldo, FinDre, FinIndicadores, FinLancamento } from '@/types/financeiro-erp';

export const finIndicadores = () => api.get<FinIndicadores>('/financeiro-erp/indicadores');
export const finCadastros = () => api.get<FinCadastros>('/financeiro-erp/cadastros');
export const finContasSaldo = () => api.get<FinContaSaldo[]>('/financeiro-erp/contas/saldo');
export const finDre = (de?: string, ate?: string) => api.get<FinDre>('/financeiro-erp/dre', { parametros: { de, ate } });
export const finLancamentos = (operacao?: string, situacao?: string, busca?: string) => api.get<FinLancamento[]>('/financeiro-erp/lancamentos', { parametros: { operacao, situacao, busca } });
export const finLancamento = (id: string) => api.get<FinLancamento>(`/financeiro-erp/lancamentos/${id}`);

export const finCriarLancamento = (d: unknown) => api.post<FinLancamento>('/financeiro-erp/lancamentos', d);
export const finPagarLancamento = (id: string, d: { valor: number; pagoEm: string; formaPagamento: string; contaBancariaId?: string }) => api.post<FinLancamento>(`/financeiro-erp/lancamentos/${id}/pagar`, d);
export const finExcluirLancamento = (id: string) => api.delete(`/financeiro-erp/lancamentos/${id}`);
export const finCriarConta = (d: { nome: string; banco?: string; saldoInicial?: number }) => api.post('/financeiro-erp/contas', d);
export const finCriarCentro = (d: { nome: string }) => api.post('/financeiro-erp/centros-custo', d);
export const finCriarPlano = (d: { nome: string; grupoId: string; disponivelPdv?: boolean }) => api.post('/financeiro-erp/planos-conta', d);
