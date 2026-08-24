"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Boxes, ClipboardCheck, PackageCheck, Search } from "lucide-react";
import { comprasListar, produtosEstoque } from "@/services/api/compras";
import { rotuloCompra } from "@/components/compras/CentralCompras";
import "@/app/estoque-compras.css";

export function HubEstoque() {
  const [busca, setBusca] = useState("");
  const produtos = useQuery({ queryKey:["estoque-real",busca], queryFn:()=>produtosEstoque(busca) });
  const verificacoes = useQuery({ queryKey:["compras","estoque","verificacao"], queryFn:()=>comprasListar(undefined,"todas","verificacao_estoque") });
  const recebimentos = useQuery({ queryKey:["compras","estoque","recebimentos"], queryFn:()=>comprasListar(undefined,"todas","aguardando_entrega") });
  const linhas=produtos.data??[];const saldo=linhas.reduce((n,p)=>n+Number(p.saldo??0),0);const reservado=linhas.reduce((n,p)=>n+Number(p.reservado??0),0);const criticos=linhas.filter(p=>Number(p.saldo??0)-Number(p.reservado??0)<=0).length;
  return <main className="es-page"><header className="es-hero"><div><span>ESTOQUE + COMPRAS</span><h1>Controle de estoque</h1><p>Saldo atual do cadastro existente, reservas feitas por Compras e filas que exigem ação.</p></div><Link href="/compras/todas">Abrir operação de Compras <ArrowRight/></Link></header>
    <section className="es-kpis"><article><Boxes/><div><b>{linhas.length}</b><span>produtos consultados</span></div></article><article><PackageCheck/><div><b>{saldo.toLocaleString("pt-BR")}</b><span>unidades em saldo</span></div></article><article><ClipboardCheck/><div><b>{reservado.toLocaleString("pt-BR")}</b><span>unidades reservadas</span></div></article><article><AlertTriangle/><div><b>{criticos}</b><span>sem saldo disponível</span></div></article></section>
    <div className="es-grid"><section className="es-card es-products"><header><div><small>POSIÇÃO REAL</small><h2>Produtos e saldos</h2></div><label><Search/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Código ou descrição"/></label></header><div className="es-table"><div className="head"><span>Produto</span><span>Saldo</span><span>Reservado</span><span>Disponível</span></div>{linhas.map(p=><div key={p.produtoId}><span><b>{p.descricao||"Sem descrição"}</b><small>{p.codigo||`#${p.produtoId}`}</small></span><span>{Number(p.saldo??0).toLocaleString("pt-BR")}</span><span>{Number(p.reservado??0).toLocaleString("pt-BR")}</span><strong>{(Number(p.saldo??0)-Number(p.reservado??0)).toLocaleString("pt-BR")}</strong></div>)}</div>{!produtos.isLoading&&!linhas.length&&<p className="es-empty">Nenhum produto encontrado no estoque existente.</p>}</section>
      <aside className="es-queues"><Fila titulo="Verificações pendentes" itens={verificacoes.data??[]} vazio="Nenhuma solicitação aguardando estoque."/><Fila titulo="Pedidos a receber" itens={recebimentos.data??[]} vazio="Nenhum pedido aguardando recebimento."/></aside></div>
    <section className="es-note"><b>Escopo atual do controle</b><p>A reserva já altera o campo reservado do estoque real. Saída, entrada, devolução e troca ainda precisam da automação de movimentações; até essa etapa ser entregue, não considere esses quatro eventos baixados automaticamente.</p></section>
  </main>
}
function Fila({titulo,itens,vazio}:{titulo:string;itens:Awaited<ReturnType<typeof comprasListar>>;vazio:string}){return <section className="es-card"><header><h2>{titulo}</h2><span>{itens.length}</span></header>{itens.map(s=><Link href={`/compras/${s.id}`} key={s.id}><div><small>{s.protocolo}</small><b>{s.titulo}</b><span>{rotuloCompra(s.situacao)} · {s.itens.length} item(ns)</span></div><ArrowRight/></Link>)}{!itens.length&&<p className="es-empty">{vazio}</p>}</section>}
