import { api } from './client';
import type { PdvCaixaSessao, PdvIndicadores, PdvProduto, PdvResumoSessao, PdvTerminal, PdvVenda } from '@/types/pdv';

export const pdvIndicadores = () => api.get<PdvIndicadores>('/pdv/indicadores');
export const pdvTerminais = () => api.get<PdvTerminal[]>('/pdv/terminais');
export const pdvProdutos = (busca?: string) => api.get<PdvProduto[]>('/pdv/produtos', { parametros: { busca } });
export const pdvSessaoAtual = () => api.get<PdvCaixaSessao | null>('/pdv/caixa/atual');
export const pdvResumoSessao = (id: string) => api.get<PdvResumoSessao>(`/pdv/caixa/${id}/resumo`);
export const pdvVendas = (busca?: string, situacao?: string) => api.get<PdvVenda[]>('/pdv/vendas', { parametros: { busca, situacao } });
export const pdvVenda = (id: string) => api.get<PdvVenda>(`/pdv/vendas/${id}`);

export const pdvAbrirCaixa = (terminalId: string, fundoAbertura: number) => api.post<PdvCaixaSessao>('/pdv/caixa/abrir', { terminalId, fundoAbertura });
export const pdvMovimentarCaixa = (id: string, d: { tipo: string; valor: number; motivo?: string }) => api.post('/pdv/caixa/' + id + '/movimentos', d);
export const pdvFecharCaixa = (id: string, d: { contadoDinheiro: number; observacoes?: string }) => api.post<PdvCaixaSessao>(`/pdv/caixa/${id}/fechar`, d);
export const pdvRegistrarVenda = (d: unknown) => api.post<PdvVenda>('/pdv/vendas', d);
export const pdvCancelarVenda = (id: string, motivo: string) => api.post<PdvVenda>(`/pdv/vendas/${id}/cancelar`, { motivo });
