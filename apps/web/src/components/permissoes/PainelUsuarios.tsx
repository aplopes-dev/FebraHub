"use client";

/* ============ USUÁRIOS ============
   Quem entra, com qual perfil de acesso e sobre quais setores. Os dois eixos
   aparecem lado a lado de propósito — é a pergunta que a tela responde:

     perfil de acesso -> o QUE a pessoa pode fazer (as telas, as ações)
     setores          -> SOBRE QUAIS DADOS (comercial, financeiro…)

   A senha nunca é digitada aqui. Criar conta e "esqueci a senha" geram uma
   temporária no servidor, mostrada UMA vez nesta tela, com troca obrigatória
   no primeiro acesso — mesma regra do seed. */

import { useState } from "react";
import { Copy, KeyRound, Loader2, Plus, UserPlus } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { Select } from "@/components/ui/Select";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO, inputAv, labelAv } from "@/components/ui/estilos";
import { useAcoesUsuarios, usePerfisAcesso, useUsuariosAdmin } from "@/hooks/permissoes";
import { ErroApi } from "@/services/api/client";
import { HUBS } from "@/lib/hubs";
import { C, SANS, alfa } from "@/lib/tema";
import type { UsuarioAdmin } from "@/types/permissoes";

/** Setores do cadastro: os hubs + 'geral', que é a diretoria histórica. */
const SETORES = ["geral", ...HUBS.map((h) => h.key)];
const PAPEIS = ["admin", "gestor", "membro"];

const dataCurta = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }) : "nunca";

export function PainelUsuarios() {
  const usuarios = useUsuariosAdmin();
  const perfis = usePerfisAcesso();
  const { criar, atualizar, redefinirSenha } = useAcoesUsuarios();

  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", papel: "membro", setor: "comercial", perfilAcessoId: "" });
  const [senhaGerada, setSenhaGerada] = useState<{ email: string; senha: string } | null>(null);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);
  const [redefinindo, setRedefinindo] = useState<UsuarioAdmin | null>(null);

  const lista = usuarios.data ?? [];
  const opcoesPerfil = perfis.data ?? [];

  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível salvar." });

  const salvarCampo = (u: UsuarioAdmin, dados: Parameters<typeof atualizar.mutate>[0]["dados"]) => {
    setAviso(null);
    atualizar.mutate(
      { id: u.id, dados },
      { onSuccess: () => setAviso({ erro: false, texto: `${u.nome} atualizado.` }), onError: falhou },
    );
  };

  const criarConta = () => {
    setAviso(null);
    criar.mutate(
      {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        papel: form.papel,
        setor: form.setor,
        perfilAcessoId: form.perfilAcessoId || undefined,
      },
      {
        onSuccess: (r) => {
          setSenhaGerada({ email: r.usuario.email, senha: r.senhaTemporaria });
          setNovo(false);
          setForm({ nome: "", email: "", papel: "membro", setor: "comercial", perfilAcessoId: "" });
        },
        onError: falhou,
      },
    );
  };

  const gerarSenha = (u: UsuarioAdmin) => {
    setAviso(null);
    redefinirSenha.mutate(u.id, {
      onSuccess: (r) => { setRedefinindo(null); setSenhaGerada({ email: u.email, senha: r.senhaTemporaria }); },
      onError: (e: unknown) => { setRedefinindo(null); falhou(e); },
    });
  };

  return (
    <>
      {aviso && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${aviso.erro ? alfa("down", 0.4) : alfa("up", 0.4)}`,
          background: aviso.erro ? alfa("down", 0.09) : alfa("up", 0.09),
          color: aviso.erro ? C.down : C.up,
        }}>
          {aviso.texto}
        </div>
      )}

      {senhaGerada && (
        <div style={{
          marginBottom: 16, padding: "14px 16px", borderRadius: 12,
          border: `1px solid ${alfa("gold", 0.45)}`, background: alfa("gold", 0.1),
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>
            Senha temporária de {senhaGerada.email}
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, margin: "5px 0 10px", lineHeight: 1.5 }}>
            Ela aparece só desta vez — o banco guarda apenas o hash. Entregue pessoalmente; a troca é
            obrigatória no primeiro acesso.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <code style={{
              fontSize: 14, fontWeight: 700, letterSpacing: ".5px", color: C.gold,
              background: alfa("sup", 0.08), padding: "7px 12px", borderRadius: 8,
            }}>
              {senhaGerada.senha}
            </code>
            <button
              onClick={() => void navigator.clipboard?.writeText(senhaGerada.senha)}
              style={BOTAO_SECUNDARIO}
            >
              <Copy size={12} /> Copiar
            </button>
            <button onClick={() => setSenhaGerada(null)} style={BOTAO_SECUNDARIO}>Já anotei</button>
          </div>
        </div>
      )}

      <Bloco
        titulo={`Usuários${lista.length ? ` · ${lista.length}` : ""}`}
        canto={
          <button
            onClick={() => setNovo((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
              cursor: "pointer", color: C.gold, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, padding: 0,
            }}
          >
            <UserPlus size={13} /> Nova conta
          </button>
        }
        sem
      >
        {novo && (
          <div style={{ padding: 18, borderBottom: `1px solid ${C.hair}`, background: alfa("sup", 0.03) }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
              <div>
                <label style={labelAv} htmlFor="u-nome">Nome</label>
                <input id="u-nome" style={inputAv} value={form.nome} maxLength={120}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Maria Silva" />
              </div>
              <div>
                <label style={labelAv} htmlFor="u-email">E-mail</label>
                <input id="u-email" style={inputAv} type="email" value={form.email} maxLength={160}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maria@febracis.com.br" />
              </div>
              <div>
                <label style={labelAv} htmlFor="u-perfil">Perfil de acesso</label>
                <Select id="u-perfil" style={{ width: "100%" }} aria-label="Perfil de acesso" value={form.perfilAcessoId}
                  onChange={(v) => setForm({ ...form, perfilAcessoId: v })}
                  options={[{ value: "", label: "Equipe (padrão)" }, ...opcoesPerfil.map((p) => ({ value: p.id, label: p.nome }))]} />
              </div>
              <div>
                <label style={labelAv} htmlFor="u-setor">Setor</label>
                <Select id="u-setor" style={{ width: "100%" }} aria-label="Setor" value={form.setor}
                  onChange={(v) => setForm({ ...form, setor: v })}
                  options={SETORES.map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <label style={labelAv} htmlFor="u-papel">Papel</label>
                <Select id="u-papel" style={{ width: "100%" }} aria-label="Papel" value={form.papel}
                  onChange={(v) => setForm({ ...form, papel: v })}
                  options={PAPEIS.map((p) => ({ value: p, label: p }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={criarConta}
                disabled={criar.isPending || form.nome.trim().length < 3 || !form.email.includes("@")}
                style={
                  criar.isPending || form.nome.trim().length < 3 || !form.email.includes("@")
                    ? BOTAO_OURO_OFF
                    : BOTAO_OURO
                }
              >
                {criar.isPending ? <Loader2 size={13} className="girar" /> : <Plus size={13} />} Criar conta
              </button>
              <button onClick={() => setNovo(false)} style={BOTAO_SECUNDARIO}>Cancelar</button>
            </div>
          </div>
        )}

        <Estado carregando={usuarios.isLoading} erro={usuarios.error} vazio={!usuarios.isLoading && lista.length === 0}
          vazioTitulo="Nenhuma conta cadastrada"
          vazioDica="Crie a primeira no botão acima.">
          <div>
            {lista.map((u) => (
              <div
                key={u.id}
                className="fh-linha-usuario"
                style={{
                  padding: "14px 18px", borderBottom: `1px solid ${C.hair}`,
                  opacity: u.ativo ? 1 : 0.55,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.bright, display: "flex", alignItems: "center", gap: 7 }}>
                    {u.nome}
                    {!u.ativo && <span style={etiqueta}>inativo</span>}
                    {u.papel === "admin" && <span style={{ ...etiqueta, color: C.gold }}>admin</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4, fontWeight: 700 }}>
                    último acesso {dataCurta(u.ultimoLogin)}
                  </div>
                </div>

                <div>
                  <label style={labelAv} htmlFor={`perfil-${u.id}`}>Perfil de acesso</label>
                  <Select
                    id={`perfil-${u.id}`}
                    style={{ width: "100%" }}
                    aria-label="Perfil de acesso"
                    value={u.perfilAcessoId ?? ""}
                    onChange={(v) => salvarCampo(u, { perfilAcessoId: v || null })}
                    options={[{ value: "", label: "— sem perfil —" }, ...opcoesPerfil.map((p) => ({ value: p.id, label: p.nome }))]}
                  />
                </div>

                <div>
                  <label style={labelAv} htmlFor={`setor-${u.id}`}>Setor principal</label>
                  <Select
                    id={`setor-${u.id}`}
                    style={{ width: "100%" }}
                    aria-label="Setor principal"
                    value={u.setor}
                    onChange={(v) => salvarCampo(u, { setor: v })}
                    options={SETORES.map((s) => ({ value: s, label: s }))}
                  />
                  {u.setores.length > 1 && (
                    <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4, fontWeight: 700 }}>
                      + {u.setores.filter((s) => s !== u.setor).join(", ")}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setRedefinindo(u)} style={BOTAO_SECUNDARIO} title="Gerar senha temporária">
                    <KeyRound size={12} /> Senha
                  </button>
                  <button
                    onClick={() => salvarCampo(u, { ativo: !u.ativo })}
                    style={u.ativo ? BOTAO_SECUNDARIO : BOTAO_OURO}
                    title={u.ativo ? "Desativar a conta e encerrar as sessões" : "Reativar a conta"}
                  >
                    {u.ativo ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Estado>
      </Bloco>
      {redefinindo && (
        <ModalConfirmar
          titulo="Gerar nova senha"
          mensagem={<>Gerar nova senha temporária para <b>{redefinindo.nome}</b>? As sessões ativas dela serão encerradas.</>}
          rotuloConfirmar="Gerar senha"
          carregando={redefinirSenha.isPending}
          onConfirmar={() => gerarSenha(redefinindo)}
          onFechar={() => setRedefinindo(null)}
        />
      )}
    </>
  );
}

const etiqueta = {
  padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 800,
  textTransform: "uppercase" as const, letterSpacing: ".4px",
  background: alfa("sup", 0.08), color: C.faint,
};
