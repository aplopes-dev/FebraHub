import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { ChangePlanDialog } from "./change-plan-dialog";
import type { LojaDetail } from "../../types";

const { fetchPlansMock } = vi.hoisted(() => ({
  fetchPlansMock: vi.fn().mockResolvedValue({
    data: [
      {
        id: "plan-food-pro",
        code: "food-pro",
        name: "Comércio Pro",
        description: "",
        prices: [{ id: "price-1", cycle: "MONTHLY", priceCents: 19900, status: "ACTIVE" }],
        vertical: "Comércio",
        tier: "pro",
        maxNegocios: 10,
        maxStores: 10,
        maxUsers: 20,
        status: "ACTIVE",
        subscriberCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    meta: { total: 1, page: 1, perPage: 100, totalPages: 1 },
  }),
}));

vi.mock("@/lib/admin-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-api")>("@/lib/admin-api");
  return {
    ...actual,
    fetchPlans: fetchPlansMock,
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
  timezone: "America/Bahia",
  plan: {
    subscriptionId: "sub-1",
    planId: "plan-food-basico",
    planName: "Comércio Básico",
    vertical: "Comércio",
    tier: "basico",
    cycle: "MONTHLY",
    priceCents: 9900,
    status: "ACTIVE",
    currentPeriodStart: "2026-07-01T00:00:00.000Z",
    currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  },
  billing: { subscription: undefined, invoices: [] },
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

describe("ChangePlanDialog", () => {
  it("locks the plan selector to the store's own vertical (US4)", async () => {
    fetchPlansMock.mockClear();

    renderWithProviders(
      <ChangePlanDialog open onOpenChange={vi.fn()} detail={DETAIL} />,
    );

    await waitFor(() => expect(fetchPlansMock).toHaveBeenCalled());

    expect(fetchPlansMock).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: "Comércio" }),
    );
    expect(fetchPlansMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ vertical: "Clínica" }),
    );
  });
});
