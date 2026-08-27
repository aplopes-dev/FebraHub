"use client";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Pencil, Plus, Search, ShieldAlert, Star, X } from 'lucide-react';
import {
  fornecedorAtualizar,
  fornecedorCriar,
  fornecedorObter,
  fornecedorSituacao,
  fornecedoresListar,
} from '@/services/api/fornecedores';
import type { Fornecedor, FornecedorContato, SituacaoFornecedor } from '@/types/fornecedores';
import { Select } from '@/components/ui/Select';
import { useFecharComEsc } from '@/hooks/formulario';
import '@/app/fornecedores.css';

const SITUACOES: { valor: SituacaoFornecedor; rotulo: string; cor: string }[] = [
  { valor: 'ativo', rotulo: 'Ativo', cor: '#2f855a' },
  { valor: 'em_homologacao', rotulo: 'Em homologação', cor: '#b88924' },
  { valor: 'inativo', rotulo: 'Inativo', cor: '#777' },
  { valor: 'bloqueado', rotulo: 'Bloqueado', cor: '#c94b4b' },
];
const rotuloSit = (s: string) => SITUACOES.find((x) => x.valor === s)?.rotulo ?? s;
const corSit = (s: string) => SITUACOES.find((x) => x.valor === s)?.cor ?? '#777';
const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Rascunho = Partial<Fornecedor> & { contatos: FornecedorContato[] };
const vazio = (): Rascunho => ({ razaoSocial: '', situacao: 'ativo', categorias: [], contatos: [] });

export function Fornecedores() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [erroSituacao, setErroSituacao] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['fornecedores', busca, filtro],
    queryFn: () => fornecedoresListar(busca || undefined, filtro || undefined),
  });

  const salvar = useMutation({
    mutationFn: (r: Rascunho) => {
      const corpo = {
        razaoSocial: r.razaoSocial,
        nomeFantasia: r.nomeFantasia,
        documento: r.documento,
        inscricao: r.inscricao,
        email: r.email,
        telefone: r.telefone,
        whatsapp: r.whatsapp,
        endereco: r.endereco,
        cidade: r.cidade,
        uf: r.uf,
        cep: r.cep,
        categorias: r.categorias ?? [],
        banco: r.banco,
        agencia: r.agencia,
        conta: r.conta,
        chavePix: r.chavePix,
        prazoMedioDias: r.prazoMedioDias ?? undefined,
        condicoesComerciais: r.condicoesComerciais,
        situacao: r.situacao,
        observacoes: r.observacoes,
        contatos: (r.contatos ?? []).filter((c) => c.nome?.trim()),
      };
      return r.id ? fornecedorAtualizar(r.id, corpo) : fornecedorCriar(corpo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fornecedores'] });
      setEditando(null);
    },
  });

  const mudarSituacao = useMutation({
    mutationFn: ({ id, situacao }: { id: string; situacao: SituacaoFornecedor }) =>
      fornecedorSituacao(id, situacao),
    onSuccess: () => { setErroSituacao(null); qc.invalidateQueries({ queryKey: ['fornecedores'] }); },
    onError: (e: unknown) => setErroSituacao(e instanceof Error ? e.message : 'Não foi possível alterar a situação do fornecedor.'),
  });

  const lista = q.data ?? [];

  return (
    <main className="co-page">
      <header className="co-hero">
        <div>
          <span>CADASTRO CORPORATIVO</span>
          <h1>Fornecedores</h1>
          <p>Cadastro único de fornecedores — referenciado por cotações e pedidos, com histórico consolidado de compras.</p>
        </div>
        <button className="co-primary-link" onClick={() => setEditando(vazio())}>
          <Plus /> Novo fornecedor
        </button>
      </header>

      <section className="co-panel">
        <header>
          <div>
            <small>BASE DE FORNECEDORES</small>
            <h2>{lista.length} fornecedor(es)</h2>
          </div>
          <div className="fo-filtros">
            <label>
              <Search />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Razão social, CNPJ ou categoria" />
            </label>
            <Select aria-label="Filtrar por situação" value={filtro} onChange={setFiltro} style={{ minWidth: 170 }}
              options={[{ value: "", label: "Todas as situações" }, ...SITUACOES.map((s) => ({ value: s.valor, label: s.rotulo }))]} />
          </div>
        </header>

        {q.isError && <div className="co-error">Não foi possível carregar os fornecedores.</div>}
        {erroSituacao && <div className="co-error">{erroSituacao}</div>}

        <div className="fo-grid">
          {lista.map((f) => (
            <article key={f.id} className="fo-card">
              <button className="fo-card-main" onClick={() => setDetalheId(f.id)}>
                <div className="fo-card-title">
                  <Building2 />
                  <div>
                    <b>{f.nomeFantasia || f.razaoSocial}</b>
                    {f.nomeFantasia && <span>{f.razaoSocial}</span>}
                  </div>
                </div>
                <div className="fo-card-meta">
                  {f.documento && <span>{f.documento}</span>}
                  {f.categorias.slice(0, 3).map((c) => (
                    <em key={c}>{c}</em>
                  ))}
                </div>
                <div className="fo-card-foot">
                  <span className="fo-sit" style={{ '--fo-cor': corSit(f.situacao) } as React.CSSProperties}>
                    {rotuloSit(f.situacao)}
                  </span>
                  <small>{f._count?.pedidos ?? 0} pedido(s)</small>
                </div>
              </button>
              <button className="fo-edit" title="Editar" onClick={() => setEditando({ ...f, contatos: f.contatos ?? [] })}>
                <Pencil />
              </button>
            </article>
          ))}
        </div>

        {!q.isLoading && !lista.length && (
          <div className="co-empty">
            <CheckCircle2 />
            <b>Nenhum fornecedor cadastrado</b>
          </div>
        )}
      </section>

      {editando && (
        <EditorFornecedor
          rascunho={editando}
          setRascunho={setEditando}
          onSalvar={() => salvar.mutate(editando)}
          salvando={salvar.isPending}
          erro={salvar.isError ? (salvar.error as Error).message : null}
        />
      )}

      {detalheId && (
        <DetalheFornecedor
          id={detalheId}
          onFechar={() => setDetalheId(null)}
          onEditar={(f) => {
            setDetalheId(null);
            setEditando({ ...f, contatos: f.contatos ?? [] });
          }}
          onMudarSituacao={(situacao) => mudarSituacao.mutate({ id: detalheId, situacao })}
          mudandoSituacao={mudarSituacao.isPending}
        />
      )}
    </main>
  );
}

function EditorFornecedor({
  rascunho,
  setRascunho,
  onSalvar,
  salvando,
  erro,
}: {
  rascunho: Rascunho;
  setRascunho: (r: Rascunho | null) => void;
  onSalvar: () => void;
  salvando: boolean;
  erro: string | null;
}) {
  useFecharComEsc(() => setRascunho(null));
  const set = (campo: keyof Rascunho, valor: unknown) => setRascunho({ ...rascunho, [campo]: valor });
  const cats = (rascunho.categorias ?? []).join(', ');
  const contatos = rascunho.contatos ?? [];
  const setContato = (i: number, campo: keyof FornecedorContato, valor: unknown) =>
    setRascunho({ ...rascunho, contatos: contatos.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)) });

  return (
    <div className="fo-modal" role="dialog" onClick={(e) => e.target === e.currentTarget && setRascunho(null)}>
      <div className="fo-drawer">
        <header>
          <h2>{rascunho.id ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
          <button onClick={() => setRascunho(null)}><X /></button>
        </header>
        <div className="fo-drawer-body">
          <label className="fo-full">
            <span>Razão social *</span>
            <input value={rascunho.razaoSocial ?? ''} onChange={(e) => set('razaoSocial', e.target.value)} />
          </label>
          <label>
            <span>Nome fantasia</span>
            <input value={rascunho.nomeFantasia ?? ''} onChange={(e) => set('nomeFantasia', e.target.value)} />
          </label>
          <label>
            <span>CPF / CNPJ</span>
            <input value={rascunho.documento ?? ''} onChange={(e) => set('documento', e.target.value)} />
          </label>
          <label>
            <span>Inscrição</span>
            <input value={rascunho.inscricao ?? ''} onChange={(e) => set('inscricao', e.target.value)} />
          </label>
          <label>
            <span>Situação</span>
            <Select aria-label="Situação" value={rascunho.situacao ?? 'ativo'} onChange={(v) => set('situacao', v)}
              options={SITUACOES.map((s) => ({ value: s.valor, label: s.rotulo }))} />
          </label>
          <label>
            <span>E-mail</span>
            <input value={rascunho.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label>
            <span>Telefone</span>
            <input value={rascunho.telefone ?? ''} onChange={(e) => set('telefone', e.target.value)} />
          </label>
          <label>
            <span>WhatsApp</span>
            <input value={rascunho.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} />
          </label>
          <label className="fo-full">
            <span>Endereço</span>
            <input value={rascunho.endereco ?? ''} onChange={(e) => set('endereco', e.target.value)} />
          </label>
          <label>
            <span>Cidade</span>
            <input value={rascunho.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} />
          </label>
          <label>
            <span>UF</span>
            <input maxLength={2} value={rascunho.uf ?? ''} onChange={(e) => set('uf', e.target.value.toUpperCase())} />
          </label>
          <label>
            <span>CEP</span>
            <input value={rascunho.cep ?? ''} onChange={(e) => set('cep', e.target.value)} />
          </label>
          <label className="fo-full">
            <span>Categorias (separadas por vírgula)</span>
            <input value={cats} onChange={(e) => set('categorias', e.target.value.split(',').map((c) => c.trim()).filter(Boolean))} />
          </label>
          <label>
            <span>Prazo médio (dias)</span>
            <input type="number" min={0} value={rascunho.prazoMedioDias ?? ''} onChange={(e) => set('prazoMedioDias', e.target.value ? Number(e.target.value) : undefined)} />
          </label>
          <label>
            <span>Condições comerciais</span>
            <input value={rascunho.condicoesComerciais ?? ''} onChange={(e) => set('condicoesComerciais', e.target.value)} />
          </label>
          <label>
            <span>Banco</span>
            <input value={rascunho.banco ?? ''} onChange={(e) => set('banco', e.target.value)} />
          </label>
          <label>
            <span>Agência</span>
            <input value={rascunho.agencia ?? ''} onChange={(e) => set('agencia', e.target.value)} />
          </label>
          <label>
            <span>Conta</span>
            <input value={rascunho.conta ?? ''} onChange={(e) => set('conta', e.target.value)} />
          </label>
          <label>
            <span>Chave PIX</span>
            <input value={rascunho.chavePix ?? ''} onChange={(e) => set('chavePix', e.target.value)} />
          </label>
          <label className="fo-full">
            <span>Observações</span>
            <textarea rows={2} value={rascunho.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} />
          </label>

          <div className="fo-full fo-contatos">
            <div className="fo-contatos-head">
              <span>Contatos</span>
              <button type="button" onClick={() => setRascunho({ ...rascunho, contatos: [...contatos, { nome: '' }] })}>
                <Plus /> Adicionar contato
              </button>
            </div>
            {contatos.map((c, i) => (
              <div className="fo-contato-row" key={i}>
                <input placeholder="Nome" value={c.nome} onChange={(e) => setContato(i, 'nome', e.target.value)} />
                <input placeholder="Cargo" value={c.cargo ?? ''} onChange={(e) => setContato(i, 'cargo', e.target.value)} />
                <input placeholder="E-mail" value={c.email ?? ''} onChange={(e) => setContato(i, 'email', e.target.value)} />
                <input placeholder="Telefone" value={c.telefone ?? ''} onChange={(e) => setContato(i, 'telefone', e.target.value)} />
                <button type="button" className={c.principal ? 'fo-star on' : 'fo-star'} title="Principal" onClick={() => setContato(i, 'principal', !c.principal)}>
                  <Star />
                </button>
                <button type="button" className="fo-remove" onClick={() => setRascunho({ ...rascunho, contatos: contatos.filter((_, j) => j !== i) })}>
                  <X />
                </button>
              </div>
            ))}
          </div>
        </div>
        {erro && <div className="co-error fo-erro">{erro}</div>}
        <footer className="fo-drawer-foot">
          <button className="fo-ghost" onClick={() => setRascunho(null)}>Cancelar</button>
          <button className="co-primary-link" disabled={!rascunho.razaoSocial?.trim() || salvando} onClick={onSalvar}>
            {salvando ? 'Salvando…' : 'Salvar fornecedor'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function DetalheFornecedor({
  id,
  onFechar,
  onEditar,
  onMudarSituacao,
  mudandoSituacao,
}: {
  id: string;
  onFechar: () => void;
  onEditar: (f: Fornecedor) => void;
  onMudarSituacao: (s: SituacaoFornecedor) => void;
  mudandoSituacao?: boolean;
}) {
  useFecharComEsc(onFechar);
  const q = useQuery({ queryKey: ['fornecedor', id], queryFn: () => fornecedorObter(id) });
  const f = q.data;
  const contatoPrincipal = useMemo(() => f?.contatos?.find((c) => c.principal) ?? f?.contatos?.[0], [f]);

  return (
    <div className="fo-modal" role="dialog" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="fo-drawer">
        <header>
          <h2>{f ? f.nomeFantasia || f.razaoSocial : 'Fornecedor'}</h2>
          <button onClick={onFechar}><X /></button>
        </header>
        {q.isLoading && <div className="co-loading">Carregando…</div>}
        {q.isError && !f && <div className="co-error" style={{ margin: 16 }}>Não foi possível carregar este fornecedor. Verifique sua conexão e tente novamente.</div>}
        {f && (
          <div className="fo-drawer-body fo-detalhe">
            <div className="fo-full fo-sit-bar">
              <span className="fo-sit" style={{ '--fo-cor': corSit(f.situacao) } as React.CSSProperties}>{rotuloSit(f.situacao)}</span>
              <div className="fo-sit-acoes">
                {SITUACOES.filter((s) => s.valor !== f.situacao).map((s) => (
                  <button key={s.valor} disabled={mudandoSituacao} onClick={() => onMudarSituacao(s.valor)}>{s.rotulo}</button>
                ))}
                <button className="fo-ghost" onClick={() => onEditar(f)}><Pencil /> Editar</button>
              </div>
            </div>

            <section className="fo-resumo fo-full">
              <div><b>{f.resumo.pedidos}</b><span>Pedidos</span></div>
              <div><b>{f.resumo.cotacoes}</b><span>Cotações</span></div>
              <div><b>{f.resumo.cotacoesGanhas}</b><span>Ganhas</span></div>
              <div><b>{moeda(f.resumo.totalComprado)}</b><span>Total comprado</span></div>
              {f.prazoMedioDias != null && <div><b>{f.prazoMedioDias}d</b><span>Prazo médio</span></div>}
            </section>

            <div className="fo-dados fo-full">
              <dl>
                {f.razaoSocial && (<><dt>Razão social</dt><dd>{f.razaoSocial}</dd></>)}
                {f.documento && (<><dt>CPF/CNPJ</dt><dd>{f.documento}</dd></>)}
                {f.email && (<><dt>E-mail</dt><dd>{f.email}</dd></>)}
                {(f.telefone || f.whatsapp) && (<><dt>Contato</dt><dd>{[f.telefone, f.whatsapp].filter(Boolean).join(' · ')}</dd></>)}
                {(f.endereco || f.cidade) && (<><dt>Endereço</dt><dd>{[f.endereco, f.cidade, f.uf].filter(Boolean).join(', ')}</dd></>)}
                {f.categorias.length > 0 && (<><dt>Categorias</dt><dd>{f.categorias.join(', ')}</dd></>)}
                {f.condicoesComerciais && (<><dt>Condições</dt><dd>{f.condicoesComerciais}</dd></>)}
                {contatoPrincipal && (<><dt>Contato principal</dt><dd>{[contatoPrincipal.nome, contatoPrincipal.cargo, contatoPrincipal.email, contatoPrincipal.telefone].filter(Boolean).join(' · ')}</dd></>)}
                {f.observacoes && (<><dt>Observações</dt><dd>{f.observacoes}</dd></>)}
              </dl>
            </div>

            <section className="fo-hist fo-full">
              <h3>Histórico de pedidos</h3>
              {f.pedidos.length ? (
                <ul>
                  {f.pedidos.map((p) => (
                    <li key={p.id}>
                      <b>{p.numero}</b>
                      <span>{moeda(Number(p.valorTotal))}</span>
                      <small>{new Date(p.criadoEm).toLocaleDateString('pt-BR')}{p.enviadoEm ? ' · enviado' : ''}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="fo-vazio"><ShieldAlert /> Nenhum pedido emitido a este fornecedor ainda.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
