"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Boxes, ChevronLeft, ChevronRight, ClipboardCheck, PackageCheck, Search } from "lucide-react";
import { comprasListar, produtosEstoque } from "@/services/api/compras";
import { rotuloCompra } from "@/components/compras/CentralCompras";
import "@/app/estoque-compras.css";

const POR_PAGINA = 50;

export function HubEstoque() {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  // Nova busca sempre volta à primeira página.
  useEffect(() => { setPagina(1); }, [busca]);

  const produtos = useQuery({
    queryKey: ["estoque-real", busca, pagina],
    queryFn: () => produtosEstoque(busca, pagina, POR_PAGINA),
    placeholderData: keepPreviousData,
  });
  const verificacoes = useQuery({ queryKey:["compras","estoque","verificacao"], queryFn:()=>comprasListar(undefined,"todas","verificacao_estoque") });
  const recebimentos = useQuery({ queryKey:["compras","estoque","recebimentos"], queryFn:()=>comprasListar(undefined,"todas","aguardando_entrega") });

  const d = produtos.data;
  const linhas = d?.itens ?? [];
  const total = d?.total ?? 0;
  const comSaldo = d?.comSaldo ?? 0;
  const totalPaginas = d?.totalPaginas ?? 1;
  const saldoPagina = linhas.reduce((n,p)=>n+Number(p.saldo??0),0);
  const reservadoPagina = linhas.reduce((n,p)=>n+Number(p.reservado??0),0);

  const de = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const ate = Math.min(pagina * POR_PAGINA, total);

  return <main className="es-page">
    <header className="es-hero"><div><span>ESTOQUE + COMPRAS</span><h1>Controle de estoque</h1><p>Saldo atual do cadastro existente, reservas feitas por Compras e filas que exigem ação.</p></div><Link href="/compras/todas">Abrir operação de Compras <ArrowRight/></Link></header>
    <section className="es-kpis">
      <article><Boxes/><div><b>{total.toLocaleString("pt-BR")}</b><span>produtos no catálogo</span></div></article>
      <article><PackageCheck/><div><b>{comSaldo.toLocaleString("pt-BR")}</b><span>produtos com saldo</span></div></article>
      <article><ClipboardCheck/><div><b>{reservadoPagina.toLocaleString("pt-BR")}</b><span>reservados (nesta página)</span></div></article>
      <article><AlertTriangle/><div><b>{(total-comSaldo).toLocaleString("pt-BR")}</b><span>sem saldo disponível</span></div></article>
    </section>
    <div className="es-grid">
      <section className="es-card es-products">
        <header><div><small>POSIÇÃO REAL</small><h2>Produtos e saldos</h2></div><label><Search/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Código ou descrição"/></label></header>
        <div className="es-table">
          <div className="head"><span>Produto</span><span>Saldo</span><span>Reservado</span><span>Disponível</span></div>
          {linhas.map(p=><div key={p.produtoId}><span><b>{p.descricao||"Sem descrição"}</b><small>{p.codigo||`#${p.produtoId}`}</small></span><span>{Number(p.saldo??0).toLocaleString("pt-BR")}</span><span>{Number(p.reservado??0).toLocaleString("pt-BR")}</span><strong>{(Number(p.saldo??0)-Number(p.reservado??0)).toLocaleString("pt-BR")}</strong></div>)}
        </div>
        {!produtos.isLoading&&!linhas.length&&<p className="es-empty">Nenhum produto encontrado no estoque existente.</p>}
        {total>0&&<footer className="es-paginacao">
          <span>{de.toLocaleString("pt-BR")}–{ate.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")}{busca?" (filtrados)":""}</span>
          <div className="es-pag-botoes">
            <button disabled={pagina<=1||produtos.isFetching} onClick={()=>setPagina(p=>Math.max(1,p-1))}><ChevronLeft/> Anterior</button>
            <span className="es-pag-num">Página {pagina} de {totalPaginas}</span>
            <button disabled={pagina>=totalPaginas||produtos.isFetching} onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))}>Próxima <ChevronRight/></button>
          </div>
        </footer>}
      </section>
      <aside className="es-queues"><Fila titulo="Verificações pendentes" itens={verificacoes.data??[]} vazio="Nenhuma solicitação aguardando estoque."/><Fila titulo="Pedidos a receber" itens={recebimentos.data??[]} vazio="Nenhum pedido aguardando recebimento."/></aside>
    </div>
    <section className="es-note"><b>Escopo atual do controle</b><p>A reserva já altera o campo reservado do estoque real. Saída, entrada, devolução e troca ainda precisam da automação de movimentações; até essa etapa ser entregue, não considere esses quatro eventos baixados automaticamente.</p></section>
  </main>;
}
function Fila({titulo,itens,vazio}:{titulo:string;itens:Awaited<ReturnType<typeof comprasListar>>;vazio:string}){return <section className="es-card"><header><h2>{titulo}</h2><span>{itens.length}</span></header>{itens.map(s=><Link href={`/compras/${s.id}`} key={s.id}><div><small>{s.protocolo}</small><b>{s.titulo}</b><span>{rotuloCompra(s.situacao)} · {s.itens.length} item(ns)</span></div><ArrowRight/></Link>)}{!itens.length&&<p className="es-empty">{vazio}</p>}</section>}
