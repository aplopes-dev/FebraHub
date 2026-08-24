"use client";
import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Filter, Layers3, Plus, Search, Sparkles, Workflow } from 'lucide-react';
import { ModalCentro } from '@/components/ui/ModalCentro';
import { BotaoPrimario } from '@/components/ui/BotaoPrimario';
import { processoCriar, processosListar, processosVisao } from '@/services/api/processos';

export const rotuloProcesso = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
export const corSituacao: Record<string, string> = { aprovado: '#2f855a', implantado: '#b88924', aguardando_validacao: '#7652b5', ajustes_solicitados: '#c94b4b', rascunho: '#7b7b78', levantamento_iniciado: '#3976a8' };
const setores = ['marketing','eventos','rh','financeiro','pedagogico','loja','estoque','comercial'];

function CadastroProcesso({ fechar }: { fechar: () => void }) {
  const qc = useQueryClient(); const [erro, setErro] = useState('');
  const criar = useMutation({ mutationFn: processoCriar, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['processos'] }); fechar(); }, onError: (e: Error) => setErro(e.message) });
  const enviar = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); criar.mutate(Object.fromEntries(new FormData(e.currentTarget).entries())); };
  return <form onSubmit={enviar} className="pc-form">
    <div className="pc-field pc-span-2"><label>Nome do processo *</label><input name="nome" required autoFocus placeholder="Ex.: Solicitação de compra" /></div>
    <div className="pc-field"><label>Código *</label><input name="codigo" required placeholder="COM-001" /></div>
    <div className="pc-field"><label>Setor principal *</label><select name="setorPrincipal" required defaultValue=""><option value="" disabled>Selecione</option>{setores.map(s=><option key={s} value={s}>{rotuloProcesso(s)}</option>)}</select></div>
    <div className="pc-field pc-span-2"><label>Objetivo *</label><textarea name="objetivo" required placeholder="Por que este processo existe?" /></div>
    <div className="pc-field"><label>Evento inicial *</label><input name="eventoInicial" required placeholder="O que dispara o processo?" /></div>
    <div className="pc-field"><label>Resultado esperado *</label><input name="resultadoEsperado" required placeholder="Como sabemos que terminou?" /></div>
    <div className="pc-field"><label>Criticidade</label><select name="criticidade" defaultValue="media"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></div>
    <input type="hidden" name="situacao" value="rascunho" />
    {erro && <p className="pc-error pc-span-2" role="alert">{erro}</p>}
    <div className="pc-form-actions pc-span-2"><BotaoPrimario variante="secundario" onClick={fechar}>Cancelar</BotaoPrimario><BotaoPrimario type="submit" carregando={criar.isPending}>Criar processo</BotaoPrimario></div>
  </form>;
}

export function PainelProcessos() {
  const [busca, setBusca] = useState(''); const [situacao, setSituacao] = useState(''); const [novo, setNovo] = useState(false);
  const visao = useQuery({ queryKey: ['processos', 'visao'], queryFn: processosVisao });
  const lista = useQuery({ queryKey: ['processos', busca], queryFn: () => processosListar(busca) });
  const filtrados = useMemo(() => (lista.data ?? []).filter(p => !situacao || p.situacao === situacao), [lista.data, situacao]);
  if (visao.isLoading || lista.isLoading) return <div className="pc-loading"><Workflow className="pc-pulse"/>Preparando a Central…</div>;
  if (visao.error || lista.error) return <div className="pc-error-state" role="alert"><AlertTriangle/>Não foi possível carregar os processos.</div>;
  const cards = [
    ['Processos mapeados', visao.data?.total ?? 0, 'Base operacional', Workflow, 'ouro'],
    ['Em levantamento', (visao.data?.porSituacao.rascunho ?? 0)+(visao.data?.porSituacao.levantamento_iniciado ?? 0), 'Trabalho em curso', Layers3, 'azul'],
    ['Aguardando validação', visao.data?.porSituacao.aguardando_validacao ?? 0, 'Pedem sua atenção', Clock3, 'roxo'],
    ['Aprovados', visao.data?.porSituacao.aprovado ?? 0, 'Prontos para publicar', CheckCircle2, 'verde'],
  ] as const;
  return <main className="pc-page">
    <header className="pc-hero"><div><span className="pc-eyebrow"><Sparkles size={14}/> conhecimento operacional</span><h1>Central de Processos</h1><p>Mapeie o trabalho real, valide com as lideranças e transforme conhecimento em execução.</p></div><BotaoPrimario onClick={()=>setNovo(true)}><Plus size={16}/> Novo processo</BotaoPrimario></header>
    <section className="pc-cards" aria-label="Resumo">{cards.map(([titulo, valor, apoio, Icone, tom]) => <article className={`pc-card pc-card-${tom}`} key={titulo}><div className="pc-card-icon"><Icone size={20}/></div><div><span>{titulo}</span><strong>{valor}</strong><small>{apoio}</small></div></article>)}</section>
    <section className="pc-panel pc-panel-lista"><div className="pc-toolbar"><div><span className="pc-kicker">Biblioteca operacional</span><h2>Mapa de processos</h2></div><div className="pc-tools"><label className="pc-search"><Search size={17}/><span className="sr-only">Buscar</span><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar processo ou código"/></label><label className="pc-filter"><Filter size={16}/><select value={situacao} onChange={(e)=>setSituacao(e.target.value)} aria-label="Filtrar por situação"><option value="">Todas as situações</option>{Object.keys(visao.data?.porSituacao ?? {}).map(s=><option key={s} value={s}>{rotuloProcesso(s)}</option>)}</select></label></div></div>
      <div className="pc-process-grid">{filtrados.map(p => <Link className="pc-process-card" href={`/processos/detalhe/${p.id}`} key={p.id}><div className="pc-process-top"><span className="pc-code">{p.codigo}</span><span className="pc-status" style={{'--status':corSituacao[p.situacao]??'#3976a8'} as React.CSSProperties}>{rotuloProcesso(p.situacao)}</span></div><h3>{p.nome}</h3><p>{p.objetivo}</p><div className="pc-process-meta"><span>{rotuloProcesso(p.setorPrincipal)}</span><span>Criticidade {rotuloProcesso(p.criticidade).toLowerCase()}</span><span>v{p.versaoAtual}</span></div><div className="pc-open">Abrir área de trabalho <ArrowRight size={15}/></div></Link>)}</div>
      {!filtrados.length && <div className="pc-empty"><Workflow size={32}/><b>Nenhum processo encontrado</b><span>Ajuste os filtros ou cadastre o primeiro processo.</span></div>}
    </section>{novo && <ModalCentro titulo="Novo processo" onFechar={()=>setNovo(false)} largura={720}><CadastroProcesso fechar={()=>setNovo(false)}/></ModalCentro>}
  </main>;
}
