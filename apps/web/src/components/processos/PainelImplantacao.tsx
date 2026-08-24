"use client";
import { useQuery } from '@tanstack/react-query';
import { implantacaoObter } from '@/services/api/processos';
const Barra = ({ nome, valor, peso }: { nome: string; valor: number; peso?: number }) => <article className="pc-progress"><header><b>{nome}</b><span>{valor.toFixed(1)}%{peso ? ` · peso ${peso}%` : ''}</span></header><div><i style={{ width: `${Math.min(100, valor)}%` }}/></div></article>;
export function PainelImplantacao() {
  const q = useQuery({ queryKey: ['processos', 'implantacao'], queryFn: implantacaoObter });
  if (q.isLoading) return <div style={{ padding: 32 }}>Calculando implantação…</div>;
  if (!q.data) return <div role="alert" style={{ padding: 32 }}>Não foi possível carregar a implantação.</div>;
  const d = q.data;
  return <main className="pc-page"><section className="pc-panel"><h2>Progresso calculado pelas entregas</h2><p>O percentual geral não pode ser digitado manualmente.</p><div className="pc-progress-grid"><Barra nome="Geral" valor={d.geral}/><Barra nome="Sistema" valor={d.pilares.sistema} peso={d.pesos.sistema}/><Barra nome="Automação" valor={d.pilares.automacao} peso={d.pesos.automacao}/><Barra nome="Agentes IA" valor={d.pilares.agentesIa} peso={d.pesos.agentesIa}/></div></section>
    <section className="pc-panel"><h2>Entregas</h2><div className="pc-table-wrap"><table className="pc-table"><thead><tr><th>Entrega</th><th>Setor</th><th>Pilar</th><th>Situação</th><th>Aceito</th></tr></thead><tbody>{d.entregas.map(e => <tr key={e.id}><td>{e.titulo}</td><td>{e.setor}</td><td>{e.pilar}</td><td>{e.situacao}</td><td>{Number(e.percentualAceito)}%</td></tr>)}</tbody></table></div></section></main>;
}
