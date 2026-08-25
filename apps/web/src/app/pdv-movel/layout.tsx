"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine, ShoppingCart, ListOrdered } from "lucide-react";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { PromptInstalar } from "@/components/pwa/PromptInstalar";
import "@/app/pdv-movel.css";

const TABS = [
  { href: "/pdv-movel/vender", label: "Vender", Icone: ShoppingCart },
  { href: "/pdv-movel/fila", label: "Fila", Icone: ListOrdered },
  { href: "/pdv-movel/retirada", label: "Retirada", Icone: ScanLine },
];

export default function LayoutPdvMovel({ children }: { children: ReactNode }) {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    if (sessao === null) router.replace("/login");
  }, [sessao, router]);

  if (sessao === undefined || (sessao && perfil.isLoading)) {
    return <div className="pm"><div className="pm-center">Carregando…</div></div>;
  }
  if (!sessao) return <div className="pm"><div className="pm-center">Redirecionando…</div></div>;

  const p = perfil.data;
  if (!pode(p, "loja.pedidos.operar")) {
    return (
      <div className="pm">
        <div className="pm-center">
          <div>
            <p style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>Sem acesso ao PDV</p>
            <p style={{ marginTop: 6 }}>Seu perfil não tem a permissão “operar a fila da Loja”.</p>
            <Link href="/" className="pm-btn" style={{ marginTop: 16, display: "inline-flex" }}>Voltar ao FebraHub</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm">
      <header className="pm-top">
        <div>
          <h1>FebraHub PDV</h1>
          <p className="pm-op">{p?.nome ?? "Balcão da Loja"}</p>
        </div>
        <span className="pm-top-badge">LOJA</span>
      </header>

      <main className="pm-main">
        <PromptInstalar />
        {children}
      </main>

      <nav className="pm-tabs">
        {TABS.map(({ href, label, Icone }) => {
          const ativo = caminho.startsWith(href);
          return (
            <Link key={href} href={href} className={`pm-tab ${ativo ? "on" : ""}`}>
              <Icone /> {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
