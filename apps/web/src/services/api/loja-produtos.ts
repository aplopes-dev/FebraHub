import { api } from './client';
import type {
  LojaCategoria,
  LojaIndicadores,
  LojaLocal,
  LojaMovimento,
  LojaProduto,
  ProdutoInput,
  ReposicaoResposta,
} from '@/types/loja-produtos';

// -------------------- consultas --------------------
export const lojaIndicadores = () => api.get<LojaIndicadores>('/loja/indicadores');
export const lojaReposicao = () => api.get<ReposicaoResposta>('/loja/reposicao');
export const lojaCategorias = () => api.get<LojaCategoria[]>('/loja/categorias');
export const lojaProdutos = (p: { busca?: string; categoriaId?: string; situacao?: string } = {}) =>
  api.get<LojaProduto[]>('/loja/produtos', { parametros: p });
export const lojaProduto = (id: string) => api.get<LojaProduto>(`/loja/produtos/${id}`);
export const lojaMovimentos = (id: string) => api.get<LojaMovimento[]>(`/loja/produtos/${id}/movimentos`);

// -------------------- categorias --------------------
export const lojaCriarCategoria = (d: Partial<LojaCategoria>) => api.post<LojaCategoria>('/loja/categorias', d);
export const lojaAtualizarCategoria = (id: string, d: Partial<LojaCategoria>) => api.put<LojaCategoria>(`/loja/categorias/${id}`, d);
export const lojaApagarCategoria = (id: string) => api.delete(`/loja/categorias/${id}`);

// -------------------- produtos --------------------
export const lojaCriarProduto = (d: ProdutoInput) => api.post<LojaProduto>('/loja/produtos', d);
export const lojaAtualizarProduto = (id: string, d: ProdutoInput) => api.put<LojaProduto>(`/loja/produtos/${id}`, d);
/** Alterar SÓ o preço (permissão dedicada loja.produtos.preco, auditado). */
export const lojaAlterarPreco = (id: string, d: { preco: number; motivo?: string }) =>
  api.patch<LojaProduto>(`/loja/produtos/${id}/preco`, d);
export const lojaInativarProduto = (id: string) => api.delete(`/loja/produtos/${id}`);

/** Sobe a imagem do produto (já com fundo removido) e devolve a URL pública. */
export const lojaEnviarImagemProduto = (arquivo: Blob, nome = "produto.png") => {
  const fd = new FormData();
  fd.append("arquivo", arquivo, nome);
  return api.enviarArquivo<{ url: string; chave: string }>("/loja/produtos/imagem", fd);
};

// -------------------- estoque --------------------
export const lojaAjustarEstoque = (
  id: string,
  d: { local: LojaLocal; tipo: 'entrada' | 'saida' | 'inventario'; quantidade: number; observacao?: string },
) => api.post<LojaProduto>(`/loja/produtos/${id}/estoque/ajuste`, d);

export const lojaTransferirEstoque = (
  id: string,
  d: { origem: LojaLocal; destino: LojaLocal; quantidade: number; observacao?: string },
) => api.post<LojaProduto>(`/loja/produtos/${id}/estoque/transferencia`, d);
