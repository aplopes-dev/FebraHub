"use client";
import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Layers3, Plus, Search, Sparkles, Workflow } from 'lucide-react';
import { ModalCentro } from '@/components/ui/ModalCentro';
import { Select } from '@/components/ui/Select';
import { BotaoPrimario } from '@/components/ui/BotaoPrimario';
import { processoCriar, processosListar, processosVisao } from '@/services/api/processos';
import type { Processo } from '@/types/processos';

export const rotuloProcesso = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
export const corSituacao: Record<string, string> = { aprovado: '#2f855a', implantado: '#b88924', aguardando_validacao: '#7652b5', ajustes_solicitados: '#c94b4b', rascunho: '#7b7b78', levantamento_iniciado: '#3976a8' };
const setores = ['marketing','eventos','rh','financeiro','pedagogico','loja','estoque','comercial'];

function CadastroProcesso({ fechar }: { fechar: () => void }) {
  const qc = useQueryClient(); const [erro, setErro] = useState('');
  const [setorPrincipal, setSetorPrincipal] = useState('');
  const [criticidade, setCriticidade] = useState('media');
  const criar = useMutation({ mutationFn: processoCriar, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['processos'] }); fechar(); }, onError: (e: Error) => setErro(e.message) });
  const enviar = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if(!setorPrincipal){setErro('Selecione o setor principal.');return;} criar.mutate(Object.fromEntries(new FormData(e.currentTarget).entries())); };
  return <form onSubmit={enviar} className="pc-form">
    <div className="pc-field pc-span-2"><label>Nome do processo *</label><input name="nome" required autoFocus placeholder="Ex.: Solicitação de compra" /></div>
    <div className="pc-field"><label>Código *</label><input name="codigo" required placeholder="COM-001" /></div>
    <div className="pc-field"><label>Setor principal *</label><Select aria-label="Setor principal" value={setorPrincipal} onChange={setSetorPrincipal} placeholder="Selecione" style={{width:'100%'}} options={[{value:'',label:'Selecione'},...setores.map(s=>({value:s,label:rotuloProcesso(s)}))]} /><input type="hidden" name="setorPrincipal" value={setorPrincipal} /></div>
    <div className="pc-field pc-span-2"><label>Objetivo *</label><textarea name="objetivo" required placeholder="Por que este processo existe?" /></div>
    <div className="pc-field"><label>Evento inicial *</label><input name="eventoInicial" required placeholder="O que dispara o processo?" /></div>
    <div className="pc-field"><label>Resultado esperado *</label><input name="resultadoEsperado" required placeholder="Como sabemos que terminou?" /></div>
    <div className="pc-field"><label>Criticidade</label><Select aria-label="Criticidade" value={criticidade} onChange={setCriticidade} style={{width:'100%'}} options={[{value:'baixa',label:'Baixa'},{value:'media',label:'Média'},{value:'alta',label:'Alta'},{value:'critica',label:'Crítica'}]} /><input type="hidden" name="criticidade" value={criticidade} /></div>
    <input type="hidden" name="situacao" value="rascunho" />
    {erro && <p className="pc-error pc-span-2" role="alert">{erro}</p>}
    <div className="pc-form-actions pc-span-2"><BotaoPrimario variante="secundario" onClick={fechar}>Cancelar</BotaoPrimario><BotaoPrimario type="submit" carregando={criar.isPending}>Criar processo</BotaoPrimario></div>
  </form>;
}

// Cada item do submenu de Processos foca a mesma base num recorte diferente,
// para as telas deixarem de ser idênticas. `todos` = Central/Mapa (padrão).
type SecaoProcessos = 'todos' | 'setores' | 'manuais' | 'indicadores' | 'historico';
const SECOES: Record<SecaoProcessos, { titulo: string; sub: string; kicker: string }> = {
  todos:       { titulo: 'Mapa de processos',        sub: 'Mapeie o trabalho real, valide com as lideranças e transforme conhecimento em execução.', kicker: 'Biblioteca operacional' },
  setores:     { titulo: 'Processos por setor',       sub: 'Veja como o trabalho se distribui entre as áreas da operação.',                             kicker: 'Organização por área' },
  manuais:     { titulo: 'Procedimentos e tutoriais', sub: 'Processos com manual documentado — o passo a passo pronto para consulta e treinamento.',    kicker: 'Documentação viva' },
  indicadores: { titulo: 'Indicadores de processos',  sub: 'A saúde do mapeamento: cobertura, validações pendentes e criticidade.',                     kicker: 'Saúde operacional' },
  historico:   { titulo: 'Versões dos processos',     sub: 'O que mudou por último — revisões, novas versões e atualizações recentes.',                kicker: 'Linha do tempo' },
};
const mapaSecao = (s?: string): SecaoProcessos => {
  if (s === 'setores') return 'setores';
  if (s === 'manuais') return 'manuais';
  if (s === 'indicadores') return 'indicadores';
  if (s === 'historico') return 'historico';
  return 'todos'; // '', 'mapa', 'visao' e desconhecidos caem aqui
};
const temManual = (p: Processo): boolean =>
  !!(p.manual && Object.keys(p.manual).length) || !!p.bpmnXml || !!p.descricao;

export function PainelProcessos({ secao: secaoRaw }: { secao?: string } = {}) {
  const secao = mapaSecao(secaoRaw);
  const cfg = SECOES[secao];
  const [busca, setBusca] = useState(''); const [situacao, setSituacao] = useState(''); const [setor, setSetor] = useState(''); const [novo, setNovo] = useState(false);
  const visao = useQuery({ queryKey: ['processos', 'visao'], queryFn: processosVisao });
  const lista = useQuery({ queryKey: ['processos', busca], queryFn: () => processosListar(busca) });
  const filtrados = useMemo(() => {
    let r = (lista.data ?? []).filter(p => !situacao || p.situacao === situacao);
    if (setor) r = r.filter(p => p.setorPrincipal === setor);
    if (secao === 'manuais') r = r.filter(temManual);
    if (secao === 'historico') r = [...r].sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? ''));
    return r;
  }, [lista.data, situacao, setor, secao]);
  const setoresLista = useMemo(() => Array.from(new Set((lista.data ?? []).map(p => p.setorPrincipal))).sort(), [lista.data]);
  if (visao.isLoading || lista.isLoading) return <div className="pc-loading"><Workflow className="pc-pulse"/>Preparando a Central…</div>;
  if (visao.error || lista.error) return <div className="pc-error-state" role="alert"><AlertTriangle/>Não foi possível carregar os processos.</div>;
  const cards = [
    ['Processos mapeados', visao.data?.total ?? 0, 'Base operacional', Workflow, 'ouro'],
    ['Em levantamento', (visao.data?.porSituacao.rascunho ?? 0)+(visao.data?.porSituacao.levantamento_iniciado ?? 0), 'Trabalho em curso', Layers3, 'azul'],
    ['Aguardando validação', visao.data?.porSituacao.aguardando_validacao ?? 0, 'Pedem sua atenção', Clock3, 'roxo'],
    ['Aprovados', visao.data?.porSituacao.aprovado ?? 0, 'Prontos para publicar', CheckCircle2, 'verde'],
  ] as const;
  const fmtData = (iso?: string) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return <main className="pc-page">
    <header className="pc-hero"><div><span className="pc-eyebrow"><Sparkles size={14}/> conhecimento operacional</span><h1>Central de Processos</h1><p>{cfg.sub}</p></div><BotaoPrimario onClick={()=>setNovo(true)}><Plus size={16}/> Novo processo</BotaoPrimario></header>
    <section className="pc-cards" aria-label="Resumo">{cards.map(([titulo, valor, apoio, Icone, tom]) => <article className={`pc-card pc-card-${tom}`} key={titulo}><div className="pc-card-icon"><Icone size={20}/></div><div><span>{titulo}</span><strong>{valor}</strong><small>{apoio}</small></div></article>)}</section>
    <section className="pc-panel pc-panel-lista"><div className="pc-toolbar"><div><span className="pc-kicker">{cfg.kicker}</span><h2>{cfg.titulo}</h2></div><div className="pc-tools"><label className="pc-search"><Search size={17}/><span className="sr-only">Buscar</span><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar processo ou código"/></label>{secao==='setores' && <Select aria-label="Filtrar por setor" value={setor} onChange={setSetor} style={{minWidth:170}} options={[{value:'',label:'Todos os setores'},...setoresLista.map(s=>({value:s,label:rotuloProcesso(s)}))]} />}<Select aria-label="Filtrar por situação" value={situacao} onChange={setSituacao} style={{minWidth:180}} options={[{value:'',label:'Todas as situações'},...Object.keys(visao.data?.porSituacao ?? {}).map(s=>({value:s,label:rotuloProcesso(s)}))]} /></div></div>
      <div className="pc-process-grid">{filtrados.map(p => <Link className="pc-process-card" href={`/processos/detalhe/${p.id}`} key={p.id}><div className="pc-process-top"><span className="pc-code">{p.codigo}</span><span className="pc-status" style={{'--status':corSituacao[p.situacao]??'#3976a8'} as React.CSSProperties}>{rotuloProcesso(p.situacao)}</span></div><h3>{p.nome}</h3><p>{p.objetivo}</p><div className="pc-process-meta"><span>{rotuloProcesso(p.setorPrincipal)}</span>{secao==='historico' ? <span>Atualizado {fmtData(p.atualizadoEm)}</span> : <span>Criticidade {rotuloProcesso(p.criticidade).toLowerCase()}</span>}<span>v{p.versaoAtual}</span></div><div className="pc-open">Abrir área de trabalho <ArrowRight size={15}/></div></Link>)}</div>
      {!filtrados.length && <div className="pc-empty"><Workflow size={32}/><b>{secao==='manuais' ? 'Nenhum processo com manual ainda' : 'Nenhum processo encontrado'}</b><span>{secao==='manuais' ? 'Documente o passo a passo de um processo para ele aparecer aqui.' : 'Ajuste os filtros ou cadastre o primeiro processo.'}</span></div>}
    </section>{novo && <ModalCentro titulo="Novo processo" onFechar={()=>setNovo(false)} largura={720}><CadastroProcesso fechar={()=>setNovo(false)}/></ModalCentro>}
  </main>;
}
