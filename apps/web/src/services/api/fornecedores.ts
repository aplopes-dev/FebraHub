import { api } from './client';
import type { Fornecedor, FornecedorDetalhe, FornecedorPicker, SituacaoFornecedor } from '@/types/fornecedores';

export const fornecedoresListar = (busca?: string, situacao?: string) =>
  api.get<Fornecedor[]>('/fornecedores', { parametros: { busca, situacao } });
export const fornecedorObter = (id: string) => api.get<FornecedorDetalhe>(`/fornecedores/${id}`);
export const fornecedorPicker = (busca?: string) =>
  api.get<FornecedorPicker[]>('/fornecedores/picker', { parametros: { busca } });
export const fornecedorCriar = (d: unknown) => api.post<Fornecedor>('/fornecedores', d);
export const fornecedorAtualizar = (id: string, d: unknown) => api.put<Fornecedor>(`/fornecedores/${id}`, d);
export const fornecedorSituacao = (id: string, situacao: SituacaoFornecedor) =>
  api.patch<Fornecedor>(`/fornecedores/${id}/situacao`, { situacao });
