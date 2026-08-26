import { api } from './client';
import type { StoneConcImport, StoneConcLista, StoneConcStatus } from '@/types/stone-conciliacao';

export const stoneConcStatus = () => api.get<StoneConcStatus>('/stone-conciliacao/status');

export const stoneConcTransacoes = (p: { de?: string; ate?: string; serial?: string; bandeira?: string } = {}) =>
  api.get<StoneConcLista>('/stone-conciliacao/transacoes', { parametros: p });

export const stoneConcImports = () => api.get<StoneConcImport[]>('/stone-conciliacao/imports');

/** Dispara a importação de um dia (AAAAMMDD). Sem `dia`, importa ontem. Exige financeiro.gerenciar. */
export const stoneConcImportar = (dia?: string) =>
  api.post<{ referenceDate: string; status: string; quantidade: number; erro?: string }>('/stone-conciliacao/importar', { dia });
