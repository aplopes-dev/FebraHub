"use client";

/* ============================================================
   Painel de filtros da Inteligência Territorial — porte fiel do
   FilterPanel do aplopes-dev/hub: 9 seções colapsáveis, chips com a
   cor do nicho SÓ na borda, tri-states de contato, conexões e
   visualizações salvas (localStorage). Os campos de faturamento/
   funcionários/abertura existem mesmo com a carga real zerada nesses
   campos — a API aceita os parâmetros e o recorte responde.
   A busca global fica no topo do painel (no hub ela morava no Header,
   que aqui não existe).
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Eraser,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { NICHES } from "@/lib/territorial/nichos";
import {
  CONNECTION_TYPES,
  CONNECTION_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
  REVENUE_RANGES,
  STATUS_LABELS,
  type ConnectionType,
  type DocumentType,
  type CompanyStatus,
} from "@/lib/territorial/tipos";
import { formatInt } from "@/lib/territorial/formato";
import type { EstadoTerritorial } from "@/hooks/territorial";
import {
  useCidadesTerritorial,
  useEstadosTerritorial,
  useNichosTerritorial,
  useVisualizacoesSalvas,
} from "@/hooks/territorial";
import { Botao, Chip, Switch, cx } from "./ui";

/* ------------------------------- Seção ------------------------------- */

function Secao({
  titulo,
  children,
  abertaPorPadrao = true,
}: {
  titulo: string;
  children: React.ReactNode;
  abertaPorPadrao?: boolean;
}) {
  const [aberta, setAberta] = useState(abertaPorPadrao);
  return (
    <section className="tio-secao">
      <button
        type="button"
        className="tio-secao-cab"
        onClick={() => setAberta(!aberta)}
        aria-expanded={aberta}
      >
        {titulo}
        <ChevronDown size={13} aria-hidden />
      </button>
      {aberta ? <div className="tio-secao-corpo">{children}</div> : null}
    </section>
  );
}

/* ------------------------------ Tri-state ------------------------------ */

const TRI_ROTULO: Record<string, string> = {
  undefined: "Todos",
  true: "Sim",
  false: "Não",
};

function TriState({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  const proximo = () => onChange(valor === undefined ? true : valor === true ? false : undefined);
  return (
    <button
      type="button"
      onClick={proximo}
      className="tio-tri"
      aria-label={`${rotulo}: ${TRI_ROTULO[String(valor)]}`}
    >
      <span>{rotulo}</span>
      <span className="tio-tri-selo" data-v={valor === undefined ? "null" : String(valor)}>
        {TRI_ROTULO[String(valor)]}
      </span>
    </button>
  );
}

/* --------------------- Faixa de funcionários (debounce) --------------------- */

function CamposFuncionarios({ estado }: { estado: EstadoTerritorial }) {
  const { filtros, mudar } = estado;
  const [minTexto, setMinTexto] = useState(filtros.employeesMin?.toString() ?? "");
  const [maxTexto, setMaxTexto] = useState(filtros.employeesMax?.toString() ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado externo (limpar filtros / URL) reflete nos campos.
  useEffect(() => {
    setMinTexto((atual) => {
      const externo = filtros.employeesMin?.toString() ?? "";
      return atual === externo ? atual : externo;
    });
    setMaxTexto((atual) => {
      const externo = filtros.employeesMax?.toString() ?? "";
      return atual === externo ? atual : externo;
    });
  }, [filtros.employeesMin, filtros.employeesMax]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const ler = (t: string): number | undefined => {
        if (t.trim() === "") return undefined;
        const n = Math.trunc(Number(t));
        return Number.isFinite(n) ? Math.max(0, n) : undefined;
      };
      const min = ler(minTexto);
      const max = ler(maxTexto);
      if (min !== undefined && max !== undefined && min > max) {
        setErro("O mínimo não pode ser maior que o máximo.");
        return;
      }
      setErro(null);
      if (filtros.employeesMin !== min || filtros.employeesMax !== max) {
        mudar({ employeesMin: min, employeesMax: max });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTexto, maxTexto]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <label style={{ display: "block" }}>
          <span className="tio-rotulo">Mínimo</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={minTexto}
            onChange={(e) => setMinTexto(e.target.value)}
            aria-label="Funcionários — mínimo"
            aria-invalid={erro !== null}
            className={cx("tio-campo", erro && "tio-campo-erro")}
          />
        </label>
        <label style={{ display: "block" }}>
          <span className="tio-rotulo">Máximo</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Sem limite"
            value={maxTexto}
            onChange={(e) => setMaxTexto(e.target.value)}
            aria-label="Funcionários — máximo"
            aria-invalid={erro !== null}
            className={cx("tio-campo", erro && "tio-campo-erro")}
          />
        </label>
      </div>
      {erro ? (
        <p role="alert" className="tio-msg-erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------ Painel ------------------------------ */

function alternar<T>(lista: T[] | undefined, valor: T): T[] | undefined {
  const s = new Set(lista ?? []);
  if (s.has(valor)) s.delete(valor);
  else s.add(valor);
  return s.size ? [...s] : undefined;
}

export function FiltrosTerritorial({ estado }: { estado: EstadoTerritorial }) {
  const { filtros, mudar, limpar } = estado;
  const nichos = useNichosTerritorial(filtros);
  const estados = useEstadosTerritorial();
  const cidades = useCidadesTerritorial(filtros.states);
  const { views, salvar, remover } = useVisualizacoesSalvas();
  const [buscaCidade, setBuscaCidade] = useState("");
  const [nomeView, setNomeView] = useState("");
  const [copiado, setCopiado] = useState(false);

  const cidadesVisiveis = useMemo(() => {
    const lista = cidades.data ?? [];
    const alvo = buscaCidade.trim().toLowerCase();
    const filtradas = alvo ? lista.filter((c) => c.name.toLowerCase().includes(alvo)) : lista;
    const escolhidas = new Set(filtros.cities ?? []);
    // Máx. 14 visíveis; as escolhidas sempre aparecem, mesmo fora do corte.
    const fixas = lista.filter((c) => escolhidas.has(c.name));
    const demais = filtradas.filter((c) => !escolhidas.has(c.name));
    return [...fixas, ...demais.slice(0, Math.max(0, 14 - fixas.length))];
  }, [cidades.data, buscaCidade, filtros.cities]);

  const compartilhar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* clipboard indisponível — sem quebra */
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="tio-filtros-scroll tio-scroll">
        {/* Busca global (no hub original vivia no Header). */}
        <div style={{ position: "relative", marginBottom: 4 }}>
          <Search
            size={14}
            style={{ position: "absolute", left: 10, top: 11, color: "var(--ink-faint)", pointerEvents: "none" }}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Empresa, sócio, cidade, contato…"
            value={filtros.search ?? ""}
            onChange={(e) => mudar({ search: e.target.value || undefined })}
            className="tio-campo"
            style={{ paddingLeft: 32 }}
            aria-label="Busca global"
          />
        </div>

        <Secao titulo="Nichos de mercado">
          <div className="tio-linha-chips" role="group" aria-label="Seleção múltipla de nichos">
            {NICHES.map((n) => {
              const resumo = (nichos.data ?? []).find((r) => r.slug === n.id || r.id === n.id);
              const qtd = resumo?.count ?? 0;
              const ativo = !!filtros.nicheIds?.includes(n.id);
              return (
                <Chip
                  key={n.id}
                  ativo={ativo}
                  cor={n.color}
                  disabled={qtd === 0 && !ativo}
                  onClick={() => mudar({ nicheIds: alternar(filtros.nicheIds, n.id) })}
                  title={`${n.name} — ${formatInt(qtd)} empresas`}
                  contador={formatInt(qtd)}
                >
                  {n.name}
                </Chip>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Botao
              variante="fantasma"
              onClick={() => mudar({ nicheIds: undefined })}
              disabled={!filtros.nicheIds?.length}
            >
              <Check size={13} aria-hidden /> Selecionar todos
            </Botao>
          </div>
        </Secao>

        <Secao titulo="Localização">
          <div className="tio-linha-chips" role="group" aria-label="Estados">
            {(estados.data ?? []).map((uf) => (
              <Chip
                key={uf.id}
                ativo={!!filtros.states?.includes(uf.id)}
                onClick={() => mudar({ states: alternar(filtros.states, uf.id), cities: undefined })}
                title={`${uf.name} — ${formatInt(uf.count)} empresas`}
                contador={formatInt(uf.count)}
              >
                {uf.id}
              </Chip>
            ))}
          </div>
          <input
            type="search"
            value={buscaCidade}
            onChange={(e) => setBuscaCidade(e.target.value)}
            placeholder="Filtrar cidades…"
            aria-label="Buscar cidade"
            className="tio-campo"
          />
          <div className="tio-linha-chips" role="group" aria-label="Cidades">
            {cidadesVisiveis.map((c) => (
              <Chip
                key={c.name}
                ativo={!!filtros.cities?.includes(c.name)}
                onClick={() => mudar({ cities: alternar(filtros.cities, c.name) })}
                title={`${c.name} (${c.uf}) — ${formatInt(c.count)} empresas`}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </Secao>

        <Secao titulo="Faturamento">
          <div className="tio-linha-chips" role="group" aria-label="Faixas de faturamento">
            {REVENUE_RANGES.map((r) => (
              <Chip
                key={r.id}
                ativo={!!filtros.revenueRanges?.includes(r.id)}
                onClick={() => mudar({ revenueRanges: alternar(filtros.revenueRanges, r.id) })}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </Secao>

        <Secao titulo="Funcionários">
          <CamposFuncionarios estado={estado} />
        </Secao>

        <Secao titulo="Sócios e situação">
          <label style={{ display: "block" }}>
            <span className="tio-rotulo">Mínimo de sócios</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              placeholder="Qualquer"
              value={filtros.partnersMin ?? ""}
              onChange={(e) =>
                mudar({
                  partnersMin:
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Math.trunc(Number(e.target.value))),
                })
              }
              aria-label="Quantidade mínima de sócios"
              className="tio-campo"
            />
          </label>
          <div className="tio-linha-chips" role="group" aria-label="Situação cadastral">
            {(Object.keys(STATUS_LABELS) as CompanyStatus[]).map((st) => (
              <Chip
                key={st}
                ativo={!!filtros.status?.includes(st)}
                onClick={() => mudar({ status: alternar(filtros.status, st) })}
              >
                {STATUS_LABELS[st]}
              </Chip>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <label style={{ display: "block" }}>
              <span className="tio-rotulo">Abertura de</span>
              <input
                type="number"
                inputMode="numeric"
                min={1980}
                max={2026}
                placeholder="1986"
                value={filtros.openedFrom ?? ""}
                onChange={(e) =>
                  mudar({ openedFrom: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                aria-label="Ano de abertura — de"
                className="tio-campo"
              />
            </label>
            <label style={{ display: "block" }}>
              <span className="tio-rotulo">Até</span>
              <input
                type="number"
                inputMode="numeric"
                min={1980}
                max={2026}
                placeholder="2026"
                value={filtros.openedTo ?? ""}
                onChange={(e) =>
                  mudar({ openedTo: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                aria-label="Ano de abertura — até"
                className="tio-campo"
              />
            </label>
          </div>
        </Secao>

        <Secao titulo="Documento">
          <div className="tio-linha-chips" role="group" aria-label="Tipo de documento">
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((dt) => (
              <Chip
                key={dt}
                ativo={!!filtros.documentTypes?.includes(dt)}
                onClick={() => mudar({ documentTypes: alternar(filtros.documentTypes, dt) })}
                title={`Somente registros com ${DOCUMENT_TYPE_LABELS[dt]}`}
              >
                {DOCUMENT_TYPE_LABELS[dt]}
              </Chip>
            ))}
          </div>
        </Secao>

        <Secao titulo="Contato">
          <TriState
            rotulo="Possui contato"
            valor={filtros.hasContact}
            onChange={(v) => mudar({ hasContact: v })}
          />
          <TriState
            rotulo="Possui telefone"
            valor={filtros.hasPhone}
            onChange={(v) => mudar({ hasPhone: v })}
          />
          <TriState
            rotulo="Possui e-mail"
            valor={filtros.hasEmail}
            onChange={(v) => mudar({ hasEmail: v })}
          />
          <TriState
            rotulo="Possui site"
            valor={filtros.hasWebsite}
            onChange={(v) => mudar({ hasWebsite: v })}
          />
        </Secao>

        <Secao titulo="Conexões">
          <div className="tio-linha-switch">
            Exibir conexões
            <Switch
              checked={filtros.showConnections}
              onChange={(v) => mudar({ showConnections: v })}
              label="Exibir conexões"
            />
          </div>
          <div className="tio-linha-chips" role="group" aria-label="Tipos de conexão">
            {CONNECTION_TYPES.map((t: ConnectionType) => (
              <Chip
                key={t}
                ativo={filtros.connectionTypes.includes(t)}
                disabled={!filtros.showConnections}
                onClick={() =>
                  mudar({
                    connectionTypes: (alternar(filtros.connectionTypes, t) ?? []) as ConnectionType[],
                  })
                }
              >
                {CONNECTION_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Botao
              variante="fantasma"
              disabled={!filtros.showConnections}
              onClick={() => mudar({ connectionTypes: [...CONNECTION_TYPES] })}
            >
              Todas
            </Botao>
            <Botao
              variante="fantasma"
              disabled={!filtros.showConnections}
              onClick={() => mudar({ connectionTypes: [] })}
            >
              Nenhuma
            </Botao>
          </div>
        </Secao>

        <Secao titulo="Visualizações salvas" abertaPorPadrao={false}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={nomeView}
              onChange={(e) => setNomeView(e.target.value)}
              placeholder="Nome da visualização"
              aria-label="Nome da visualização"
              className="tio-campo"
              style={{ flex: 1 }}
            />
            <Botao
              onClick={() => {
                if (nomeView.trim()) {
                  salvar(nomeView.trim(), estado.queryFiltros);
                  setNomeView("");
                }
              }}
              disabled={!nomeView.trim()}
            >
              <Bookmark size={13} aria-hidden /> Salvar
            </Botao>
          </div>
          {views.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: 0 }}>
              Nenhuma visualização salva.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
              {views.map((v) => (
                <li key={v.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    className="tio-linha-cartao tio-truncar"
                    style={{ flex: 1, minWidth: 0, display: "block" }}
                    onClick={() => estado.aplicarQueryFiltros(v.query)}
                    title={`Restaurar visualização ${v.name}`}
                  >
                    <BookmarkCheck
                      size={12}
                      style={{ marginRight: 6, verticalAlign: -2, color: "var(--accent-2)" }}
                      aria-hidden
                    />
                    {v.name}
                  </button>
                  <button
                    type="button"
                    className="tio-copiar"
                    onClick={() => remover(v.name)}
                    aria-label={`Remover visualização ${v.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>

      <div className="tio-filtros-rodape">
        <Botao variante="contorno" style={{ flex: 1 }} onClick={limpar}>
          <Eraser size={13} aria-hidden /> Limpar filtros
        </Botao>
        <Botao
          variante="fantasma"
          onClick={() => void compartilhar()}
          title="Compartilhar visualização"
          aria-label="Compartilhar visualização"
        >
          {copiado ? <Check size={13} aria-hidden /> : <Share2 size={13} aria-hidden />}
        </Botao>
      </div>
    </div>
  );
}
