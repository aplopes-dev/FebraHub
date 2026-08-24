import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils";
import { NewStoreDialog } from "./new-store-dialog";

vi.mock("@/lib/admin-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-api")>("@/lib/admin-api");
  return {
    ...actual,
    fetchPlans: vi.fn().mockResolvedValue({
      data: [
        {
          id: "11111111-1111-4111-a111-111111111111",
          code: "food-basico",
          name: "Comércio Básico",
          description: "Plano de entrada",
          prices: [
            { id: "price-1", cycle: "MONTHLY", priceCents: 9900, status: "ACTIVE" },
          ],
          vertical: "Comércio",
          tier: "basico",
          maxNegocios: 5,
          maxStores: 5,
          maxUsers: 10,
          status: "ACTIVE",
          subscriberCount: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      meta: { total: 1, page: 1, perPage: 100, totalPages: 1 },
    }),
  };
});

describe("NewStoreDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks advancing past the plan step when no plan is selected (FR-015)", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    renderWithProviders(
      <NewStoreDialog open onOpenChange={vi.fn()} onSubmit={handleSubmit} />,
    );

    await user.type(screen.getByLabelText(/nome fantasia/i), "Maria Doces");
    await user.type(screen.getByLabelText(/^slug/i), "maria-doces");

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(
      await screen.findByRole("heading", { name: "Plano e Cobrança" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/carregando planos/i)).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(await screen.findByText("Selecione um plano")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dados Fiscais" }),
    ).not.toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
