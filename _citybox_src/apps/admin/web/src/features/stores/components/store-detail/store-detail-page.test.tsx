import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils";
import { StoreDetailPage } from "./store-detail-page";
import type { LojaDetail } from "../../types";

const { fetchStoreSignaturePackageRequestsMock } = vi.hoisted(() => ({
  fetchStoreSignaturePackageRequestsMock: vi.fn(),
}));

vi.mock("@/lib/admin-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-api")>(
    "@/lib/admin-api",
  );
  return {
    ...actual,
    fetchStoreSignaturePackageRequests: fetchStoreSignaturePackageRequestsMock,
  };
});

const DETAIL: LojaDetail = {
  id: "store-1",
  tradeName: "Maria Doces",
  slug: "maria-doces",
  vertical: "Comércio",
  status: "PRODUCTION",
  clientName: "Carlos Mendes",
  createdAt: "2026-01-01",
  personType: "PJ",
  document: "11.444.777/0001-61",
  legalName: "Maria Doces LTDA",
  stateRegistration: "123456789",
  responsibleName: "Carlos Mendes",
  billingEmail: "financeiro@mariadoces.com.br",
  address: {
    zipCode: "45652-180",
    street: "Rua Jorge Amado",
    number: "42",
    neighborhood: "Centro",
    city: "Ilhéus",
    state: "BA",
  },
  phone: "(73) 3234-5678",
  timezone: "America/Bahia",
  plan: {
    subscriptionId: "sub-1",
    planId: "plan-1",
    planName: "Comércio Básico",
    vertical: "Comércio",
    tier: "basico",
    cycle: "MONTHLY",
    priceCents: 9900,
    status: "ACTIVE",
    currentPeriodStart: "2026-07-01T00:00:00.000Z",
    currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  },
  billing: {
    subscription: {
      subscriptionId: "sub-1",
      planId: "plan-1",
      planName: "Comércio Básico",
      vertical: "Comércio",
      tier: "basico",
      cycle: "MONTHLY",
      priceCents: 9900,
      status: "ACTIVE",
      currentPeriodStart: "2026-07-01T00:00:00.000Z",
      currentPeriodEnd: "2026-08-01T00:00:00.000Z",
    },
    invoices: [
      {
        id: "invoice-1",
        amountCents: 9900,
        currency: "BRL",
        status: "PAID",
        dueDate: "2026-07-10T00:00:00.000Z",
        paidAt: "2026-07-09T00:00:00.000Z",
        periodStart: "2026-07-01T00:00:00.000Z",
        periodEnd: "2026-08-01T00:00:00.000Z",
      },
    ],
  },
  connectionStatus: "online",
  team: [],
  teamSource: "platform",
  modules: [],
  integrations: [],
  metrics: {
    ordersToday: 0,
    ordersThisMonth: 0,
    averageTicketCents: 0,
    averageAcceptTimeSeconds: 0,
    revenueTodayCents: 0,
  },
  connectedTerminals: [],
  recentErrors: [],
  auditLog: [],
  settings: {
    maintenanceMode: false,
    visibleInApp: true,
    status: "PRODUCTION",
    sefazHomologacao: false,
    contingenciaOffline: false,
  },
};

const PENDING_REQUESTS = {
  data: [
    {
      id: "req-1",
      storeId: "7e0ace79-0376-4a28-b088-5e08dc0dde01",
      packageId: "pkg-250",
      quantity: 250,
      priceCents: 9990,
      status: "pending" as const,
      createdAt: "2026-08-05T12:00:00.000Z",
      liberatedAt: null,
    },
    {
      id: "req-2",
      storeId: "7e0ace79-0376-4a28-b088-5e08dc0dde01",
      packageId: "pkg-600",
      quantity: 600,
      priceCents: 19990,
      status: "pending" as const,
      createdAt: "2026-08-06T12:00:00.000Z",
      liberatedAt: null,
    },
  ],
};

describe("StoreDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchStoreSignaturePackageRequestsMock.mockResolvedValue(PENDING_REQUESTS);
  });

  it("renders fiscal, plano and billing on the same screen without extra navigation (FR-002)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreDetailPage detail={DETAIL} />);

    await user.click(screen.getByRole("tab", { name: "Fiscal" }));
    expect(screen.getByText("11.444.777/0001-61")).toBeInTheDocument();
    expect(screen.getByText("Maria Doces LTDA")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Plano" }));
    expect(screen.getByText("Comércio Básico")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Billing" }));
    expect(screen.getByText("R$ 99,00")).toBeInTheDocument();
  });

  // Decisão do dono do produto: pelo admin gerencia-se só o responsável da organização.
  // Colaborador é cadastrado dentro do app da vertical, então listá-los aqui prometeria
  // uma gestão que este painel não faz.
  it("no longer offers a members tab", () => {
    renderWithProviders(<StoreDetailPage detail={DETAIL} />);

    expect(screen.queryByRole("tab", { name: "Membros" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /equipe/i })).not.toBeInTheDocument();
  });

  it("não mostra aba Pacotes adicionais para Comércio", () => {
    renderWithProviders(<StoreDetailPage detail={DETAIL} />);

    expect(
      screen.queryByRole("tab", { name: "Pacotes adicionais" }),
    ).not.toBeInTheDocument();
  });

  it("mostra aba Pacotes adicionais após Configurações para Clínica", async () => {
    const user = userEvent.setup();
    const clinicDetail: LojaDetail = {
      ...DETAIL,
      id: "7e0ace79-0376-4a28-b088-5e08dc0dde01",
      vertical: "Clínica",
      teamSource: "vertical",
      plan: DETAIL.plan
        ? { ...DETAIL.plan, vertical: "Clínica", planName: "Clínica Básico" }
        : undefined,
      billing: {
        ...DETAIL.billing,
        subscription: DETAIL.billing.subscription
          ? {
              ...DETAIL.billing.subscription,
              vertical: "Clínica",
              planName: "Clínica Básico",
            }
          : undefined,
      },
    };

    renderWithProviders(<StoreDetailPage detail={clinicDetail} />);

    const pacotesTab = screen.getByRole("tab", { name: "Pacotes adicionais" });
    expect(pacotesTab).toBeInTheDocument();

    await user.click(pacotesTab);
    expect(
      await screen.findByText("Solicitações de Assinatura Eletrônica"),
    ).toBeInTheDocument();
    expect(await screen.findByText("250 assinaturas")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Liberar" }).length).toBeGreaterThan(
      0,
    );
    expect(fetchStoreSignaturePackageRequestsMock).toHaveBeenCalledWith(
      clinicDetail.id,
    );
  });
});
