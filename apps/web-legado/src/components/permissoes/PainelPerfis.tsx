"use client";

/* ============ PERFIS DE ACESSO ============
   Duas colunas: a lista de perfis à esquerda, o editor do selecionado à
   direita. O editor é o catálogo do servidor desenhado em grupos, com um
   checkbox por permissão — nada de campo de texto onde se digita um id.

   O perfil `admin` aparece e não edita: ele é a chave-mestra, e deixá-lo
   editável significaria conseguir se trancar para fora desta mesma tela.
   O botão "Salvar" só acende quando a seleção realmente mudou. */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { useAcoesPerfis, useCatalogoPermissoes, usePerfisAcesso } from "@/hooks/permissoes";
import { ErroApi } from "@/services/api/client";
import { C, SANS, alfa } from "@/lib/tema";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO, inputAv, labelAv } from "@/components/ui/estilos";
import type { PerfilAcesso } from "@/types/permissoes";

const mesmaLista = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));

export function PainelPerfis() {
  const perfis = usePerfisAcesso();
  const catalogo = useCatalogoPermissoes();
  const { criar, atualizar, excluir } = useAcoesPerfis();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [descNovo, setDescNovo] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);
  const [excluindoPerfil, setExcluindoPerfil] = useState<PerfilAcesso | null>(null);

  const lista = perfis.data ?? [];
  const selecionado = lista.find((p) => p.id === selecionadoId) ?? lista[0] ?? null;

  // A seleção acompanha o perfil aberto: trocar de perfil (ou receber a lista
  // depois de salvar) tem que redesenhar os checkboxes a partir do servidor.
  // As dependências são os dois campos, e não o objeto inteiro: com o objeto,
  // qualquer refetch que devolva uma instância nova (mesmo com o conteúdo
  // igual) descartaria as marcações ainda não salvas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selecionado) setMarcadas(selecionado.permissoes);
  }, [selecionado?.id, selecionado?.permissoes]);

  const sujo = useMemo(
    () => !!selecionado && !mesmaLista(marcadas, selecionado.permissoes),
    [marcadas, selecionado],
  );

  const alternar = (id: string) =>
    setMarcadas((atual) => (atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]));

  const alternarGrupo = (ids: string[], ligar: boolean) =>
    setMarcadas((atual) =>
      ligar ? [...new Set([...atual, ...ids])] : atual.filter((p) => !ids.includes(p)),
    );

  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível salvar." });

  const salvar = () => {
    if (!selecionado || selecionado.sistema) return;
    setAviso(null);
    atualizar.mutate(
      { id: selecionado.id, dados: { permissoes: marcadas } },
      {
        onSuccess: () => setAviso({ erro: false, texto: `Perfil "${selecionado.nome}" atualizado.` }),
        onError: falhou,
      },
    );
  };

  const criarPerfil = () => {
    const nome = nomeNovo.trim();
    if (nome.length < 3) return;
    setAviso(null);
    criar.mutate(
      { nome, descricao: descNovo.trim() || undefined, permissoes: [] },
      {
        onSuccess: (novo) => {
          setSelecionadoId(novo.id);
          setCriando(false);
          setNomeNovo("");
          setDescNovo("");
          setAviso({ erro: false, texto: `Perfil "${novo.nome}" criado. Marque as permissões dele.` });
        },
        onError: falhou,
      },
    );
  };

  const excluirPerfil = (p: PerfilAcesso) => {
    setAviso(null);
    excluir.mutate(p.id, {
      onSuccess: () => {
        setExcluindoPerfil(null);
        setSelecionadoId(null);
        setAviso({ erro: false, texto: `Perfil "${p.nome}" excluído.` });
      },
      onError: (e: unknown) => { setExcluindoPerfil(null); falhou(e); },
    });
  };

  return (
    <>
      {aviso && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12.5,
          border: `1px solid ${aviso.erro ? alfa("down", 0.4) : alfa("up", 0.4)}`,
          background: aviso.erro ? alfa("down", 0.09) : alfa("up", 0.09),
          color: aviso.erro ? C.down : C.up, fontWeight: 600,
        }}>
          {aviso.texto}
        </div>
      )}

      <div className="fh-grade-perfis">
        {/* ------------------------------- lista ------------------------------- */}
        <Bloco
          titulo="Perfis"
          canto={
            <button
              onClick={() => setCriando((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "none",
                border: "none", cursor: "pointer", color: C.gold, fontFamily: SANS,
                fontSize: 11.5, fontWeight: 700, padding: 0,
              }}
            >
              <Plus size={13} /> Novo
            </button>
          }
          sem
        >
          {criando && (
            <div style={{ padding: 14, borderBottom: `1px solid ${C.hair}`, background: alfa("sup", 0.03) }}>
              <label style={labelAv} htmlFor="perfil-nome">Nome do perfil</label>
              <input
                id="perfil-nome"
                style={inputAv}
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                placeholder="Coordenação de eventos"
                maxLength={60}
              />
              <label style={{ ...labelAv, marginTop: 10 }} htmlFor="perfil-desc">Descrição</label>
              <input
                id="perfil-desc"
                style={inputAv}
                value={descNovo}
                onChange={(e) => setDescNovo(e.target.value)}
                placeholder="Para quem é este perfil"
                maxLength={240}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={criarPerfil}
                  disabled={criar.isPending || nomeNovo.trim().length < 3}
                  style={criar.isPending || nomeNovo.trim().length < 3 ? BOTAO_OURO_OFF : BOTAO_OURO}
                >
                  {criar.isPending ? <Loader2 size={13} className="girar" /> : <Plus size={13} />} Criar
                </button>
                <button onClick={() => setCriando(false)} style={BOTAO_SECUNDARIO}>Cancelar</button>
              </div>
            </div>
          )}

          <Estado carregando={perfis.isLoading} erro={perfis.error} vazio={!perfis.isLoading && lista.length === 0}
            vazioTitulo="Nenhum perfil cadastrado"
            vazioDica="Crie o primeiro no botão acima.">
            <div>
              {lista.map((p) => {
                const ativo = selecionado?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelecionadoId(p.id)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "12px 18px",
                      background: ativo ? alfa("gold", 0.1) : "transparent",
                      borderLeft: `3px solid ${ativo ? C.gold : "transparent"}`,
                      borderTop: "none", borderRight: "none",
                      borderBottom: `1px solid ${C.hair}`,
                      cursor: "pointer", fontFamily: SANS,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: ativo ? C.gold : C.bright }}>
                        {p.nome}
                      </span>
                      {p.sistema && (
                        <span style={etiquetaSistema} title="Perfil de sistema: não pode ser editado">
                          <ShieldCheck size={9} /> sistema
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3, lineHeight: 1.4 }}>
                      {p.descricao ?? "Sem descrição"}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10.5, color: C.dim, fontWeight: 700 }}>
                      <span>{p.permissoes.length} permissões</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={10} /> {p.usuarios ?? 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Estado>
        </Bloco>

        {/* ------------------------------ permissões ---------------------------- */}
        <Bloco
          titulo={selecionado ? `Permissões · ${selecionado.nome}` : "Permissões"}
          canto={
            selecionado && !selecionado.sistema ? (
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => setExcluindoPerfil(selecionado)} style={botaoPerigo}>
                  <Trash2 size={12} /> Excluir
                </button>
                <button
                  onClick={salvar}
                  disabled={!sujo || atualizar.isPending}
                  style={sujo && !atualizar.isPending ? BOTAO_OURO : BOTAO_OURO_OFF}
                >
                  {atualizar.isPending ? <Loader2 size={13} className="girar" /> : null}
                  {sujo ? "Salvar" : "Salvo"}
                </button>
              </span>
            ) : selecionado ? (
              "Somente leitura"
            ) : undefined
          }
        >
          <Estado carregando={catalogo.isLoading} erro={catalogo.error} vazio={!selecionado}
            vazioTitulo="Escolha um perfil"
            vazioDica="Selecione um perfil na lista ao lado para ver e ajustar as permissões dele.">
            {selecionado && (
              <>
                {selecionado.sistema && (
                  <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.55, marginBottom: 16 }}>
                    Este é o perfil de sistema: ele recebe automaticamente toda permissão nova e não
                    pode ser alterado. Sem essa trava, uma edição aqui poderia deixar o hub sem
                    ninguém capaz de administrar acessos.
                  </p>
                )}

                {(catalogo.data ?? []).map((grupo) => {
                  const ids = grupo.permissoes.map((p) => p.id);
                  const todas = ids.every((id) => marcadas.includes(id));
                  return (
                    <div key={grupo.id} style={{ marginBottom: 22 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>{grupo.nome}</div>
                          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2, lineHeight: 1.45 }}>
                            {grupo.descricao}
                          </div>
                        </div>
                        {!selecionado.sistema && (
                          <button
                            onClick={() => alternarGrupo(ids, !todas)}
                            style={{
                              background: "none", border: "none", cursor: "pointer", color: C.gold,
                              fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: 0, whiteSpace: "nowrap",
                            }}
                          >
                            {todas ? "Desmarcar todas" : "Marcar todas"}
                          </button>
                        )}
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gap: 2 }}>
                        {grupo.permissoes.map((p) => {
                          const marcada = marcadas.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: "flex", gap: 10, alignItems: "flex-start",
                                padding: "8px 10px", borderRadius: 9,
                                background: marcada ? alfa("gold", 0.07) : "transparent",
                                cursor: selecionado.sistema ? "default" : "pointer",
                                opacity: selecionado.sistema ? 0.75 : 1,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={marcada}
                                disabled={selecionado.sistema}
                                onChange={() => alternar(p.id)}
                                style={{ marginTop: 2, accentColor: "var(--gold)", width: 15, height: 15 }}
                              />
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: marcada ? C.bright : C.muted }}>
                                  {p.nome}
                                </span>
                                <span style={{ display: "block", fontSize: 11.5, color: C.faint, marginTop: 2, lineHeight: 1.45 }}>
                                  {p.descricao}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </Estado>
        </Bloco>
      </div>
      {excluindoPerfil && (
        <ModalConfirmar
          titulo="Excluir perfil"
          mensagem={<>Excluir o perfil <b>{excluindoPerfil.nome}</b>? Os usuários vinculados perdem as permissões deste perfil.</>}
          rotuloConfirmar="Excluir"
          perigo
          carregando={excluir.isPending}
          onConfirmar={() => excluirPerfil(excluindoPerfil)}
          onFechar={() => setExcluindoPerfil(null)}
        />
      )}
    </>
  );
}

const botaoPerigo = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "none", color: C.down, border: "none", padding: 0,
  fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer",
} as const;

const etiquetaSistema = {
  display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px",
  borderRadius: 20, fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const,
  letterSpacing: ".4px", background: alfa("sup", 0.08), color: C.faint,
};
