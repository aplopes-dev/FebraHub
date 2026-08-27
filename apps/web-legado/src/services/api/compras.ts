import { api } from './client';
import type { CompraCotacao, CompraItem, CompraPedido, CompraRecebimento, CompraSolicitacao, ProdutoEstoque } from '@/types/compras';
export const comprasListar=(busca?:string,escopo?:string,situacao?:string)=>api.get<CompraSolicitacao[]>('/compras',{parametros:{busca,escopo,situacao}});
export const comprasIndicadores=()=>api.get<{total:number;porSituacao:Record<string,number>}>('/compras/indicadores');
export interface ContextoCompra{solicitante:{id:string;nome:string;setor:string};unidades:Array<{id:string;codigo:string;nome:string;principal:boolean}>;setores:Array<{id:string;slug:string;nome:string}>;setorPrincipalId?:string;unidadePrincipalId?:string;podeAlterarUnidade:boolean;podeAlterarSetor:boolean;eventos:Array<{id:string;nome:string;tipo:string}>}
export const compraContexto=()=>api.get<ContextoCompra>('/compras/formulario/contexto');
export const compraObter=(id:string)=>api.get<CompraSolicitacao>(`/compras/${id}`);
export const compraCriar=(d:unknown)=>api.post<CompraSolicitacao>('/compras',d);
export const compraAgir=(id:string,acao:string,d:Record<string,unknown>={})=>api.post<CompraSolicitacao>(`/compras/${id}/acoes`,{acao,...d});
export interface ProdutosEstoquePagina{itens:ProdutoEstoque[];total:number;comSaldo:number;pagina:number;porPagina:number;totalPaginas:number}
export const produtosEstoque=(busca?:string,pagina=1,porPagina=50)=>api.get<ProdutosEstoquePagina>('/compras/produtos/estoque',{parametros:{busca,pagina,porPagina}});
export const compraEstoque=(id:string,itemId:string,d:unknown)=>api.patch<CompraItem>(`/compras/${id}/itens/${itemId}/estoque`,d);
export const compraCotar=(id:string,d:unknown)=>api.post<CompraCotacao>(`/compras/${id}/cotacoes`,d);
export const compraEscolherCotacao=(id:string,cotacaoId:string,d:unknown)=>api.post<CompraCotacao>(`/compras/${id}/cotacoes/${cotacaoId}/escolher`,d);
export const compraEmitirPedido=(id:string,d:unknown)=>api.post<CompraPedido>(`/compras/${id}/pedidos`,d);
export const compraReceber=(id:string,d:unknown)=>api.post<CompraRecebimento>(`/compras/${id}/recebimentos`,d);
