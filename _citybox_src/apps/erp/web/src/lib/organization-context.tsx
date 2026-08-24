"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  TenancyApiError,
  fetchBranches,
  fetchMyOrganizations,
  type BranchOption,
  type MembershipRole,
  type OrganizationOption,
} from "@/lib/api/tenancy";
import { useSession } from "@/lib/session-context";
import { setActiveScope } from "@/lib/api/active-scope";

const ORGANIZATION_KEY = "citybox-comercio-active-org";
const BRANCH_KEY = "citybox-comercio-active-branch";

export type TenancyLoadError = "unavailable" | "unauthorized";

type OrganizationContextValue = {
  organizations: OrganizationOption[];
  organization: OrganizationOption | null;
  organizationId: string;
  role: MembershipRole | null;

  branches: BranchOption[];
  branch: BranchOption | null;
  /** `null` = operando a organização inteira (sem unidade escolhida). */
  branchId: string | null;
  /**
   * Há mais de uma unidade e nenhuma escolha válida salva — o login deve
   * forçar `/selecionar-unidade` antes de entrar no app.
   */
  needsBranchSelection: boolean;
  /** OWNER/ADMIN operam todas as unidades (`branchId` null = escopo org). */
  accessesAllBranches: boolean;

  setOrganization: (id: string) => void;
  setBranch: (id: string | null) => void;

  /** Terminou de ler o localStorage e de carregar as organizações. */
  hydrated: boolean;
  loading: boolean;
  /** Unidades da organização ativa ainda sendo consultadas. */
  branchesLoading: boolean;
  error: TenancyLoadError | null;
  reload: () => void;
};

/** Papéis que enxergam/operam a organização inteira (sem recorte de unidade). */
export function roleAccessesAllBranches(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "OWNER" || role === "ADMIN";
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)?.trim() || null;
  } catch {
    return null;
  }
}

function persist(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // navegador sem storage (aba anônima restrita): segue com a escolha em memória
  }
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [error, setError] = useState<TenancyLoadError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    // Todo o setState acontece dentro do async: chamar direto no corpo do
    // efeito dispara renderização em cascata (regra `set-state-in-effect`).
    void (async () => {
      if (status !== "authenticated") {
        if (cancelled) return;
        setOrganizations([]);
        setOrganizationId("");
        setBranches([]);
        setBranchId(null);
        setBranchesLoading(false);
        setLoading(false);
        setHydrated(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const list = await fetchMyOrganizations();
        if (cancelled) return;

        setOrganizations(list);

        const saved = readStored(ORGANIZATION_KEY);
        const savedStillValid = list.some((org) => org.id === saved);
        // Uma organização só: entra direto. Várias sem escolha salva: deixa
        // vazio de propósito, para o usuário escolher em /selecionar-organizacao
        // em vez de cair numa empresa à revelia.
        const resolved =
          savedStillValid && saved
            ? saved
            : list.length === 1
              ? list[0]!.id
              : "";

        setOrganizationId(resolved);
        persist(ORGANIZATION_KEY, resolved || null);
      } catch (err) {
        if (cancelled) return;
        setOrganizations([]);
        setOrganizationId("");
        setError(
          err instanceof TenancyApiError && err.status === 401
            ? "unauthorized"
            : "unavailable",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, status]);

  // Unidades acompanham a organização ativa.
  useEffect(() => {
    let cancelled = false;

    if (!organizationId) {
      setBranches([]);
      setBranchId(null);
      setBranchesLoading(false);
      return;
    }

    setBranchesLoading(true);
    setBranches([]);

    void (async () => {
      try {
        const list = await fetchBranches(organizationId);
        if (cancelled) return;
        setBranches(list);

        const saved = readStored(BRANCH_KEY);
        const savedStillValid = list.some((item) => item.id === saved);
        // Uma unidade só: entra nela. Várias sem escolha salva: deixa null
        // (não assume "todas") — `/entrada` manda para `/selecionar-unidade`.
        const resolved = savedStillValid
          ? saved
          : list.length === 1
            ? list[0]!.id
            : null;

        setBranchId(resolved);
        persist(BRANCH_KEY, resolved);
      } catch {
        // Mantém branches vazias; o header mostra estado de erro em vez de sumir.
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const setOrganization = useCallback(
    (id: string) => {
      if (id === organizationId) return;
      setOrganizationId(id);
      persist(ORGANIZATION_KEY, id);
      // A unidade pertence à organização anterior — limpar evita mandar um
      // X-Branch-Id de outra empresa (a API recusaria, mas a tela piscaria erro).
      setBranches([]);
      setBranchId(null);
      setBranchesLoading(true);
      persist(BRANCH_KEY, null);
      // Sem isto, as telas mostrariam por um instante os dados da empresa
      // anterior, que já estão no cache do React Query.
      void queryClient.invalidateQueries();
    },
    [organizationId, queryClient],
  );

  const setBranch = useCallback(
    (id: string | null) => {
      setBranchId(id);
      persist(BRANCH_KEY, id);
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  // Publica o escopo para o cliente HTTP, que roda fora da árvore React.
  //
  // Durante o render, e não num efeito: efeitos de filhos rodam ANTES dos do
  // pai, então um `useQuery` habilitado no mesmo commit dispararia o fetch com
  // o escopo anterior — e a API responderia 400. É escrita em módulo,
  // idempotente e sem agendar render.
  setActiveScope({ organizationId, branchId });

  const organization = useMemo(
    () => organizations.find((org) => org.id === organizationId) ?? null,
    [organizationId, organizations],
  );

  const branch = useMemo(
    () => branches.find((item) => item.id === branchId) ?? null,
    [branchId, branches],
  );

  const role = organization?.role ?? null;
  const accessesAllBranches = roleAccessesAllBranches(role);
  const needsBranchSelection =
    Boolean(organizationId) &&
    !branchesLoading &&
    branches.length > 1 &&
    branchId === null;

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      organization,
      organizationId,
      role,
      branches,
      branch,
      branchId,
      needsBranchSelection,
      accessesAllBranches,
      setOrganization,
      setBranch,
      hydrated,
      loading,
      branchesLoading,
      error,
      reload,
    }),
    [
      accessesAllBranches,
      branch,
      branchId,
      branches,
      branchesLoading,
      error,
      hydrated,
      loading,
      needsBranchSelection,
      organization,
      organizationId,
      organizations,
      reload,
      role,
      setBranch,
      setOrganization,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error(
      "useOrganization deve ser usado dentro de OrganizationProvider",
    );
  }
  return ctx;
}

/**
 * Chave de cache do catálogo e sinal de "já dá para consultar".
 *
 * O escopo em si viaja nos headers (`active-scope`); o que o React Query
 * precisa é de uma **chave** que mude junto com empresa e unidade — senão a
 * troca de unidade serviria a lista anterior do cache.
 */
export function useCatalogScope(): { scope: string; ready: boolean } {
  const { organizationId, branchId, hydrated } = useOrganization();
  return {
    scope: `${organizationId}:${branchId ?? "all"}`,
    ready: hydrated && Boolean(organizationId),
  };
}
