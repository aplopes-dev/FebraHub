import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlansGrid } from "./plans-grid";
import type { Plan } from "../types";

function buildPlan(overrides: Partial<Plan>): Plan {
  return {
    id: overrides.id ?? "plan-1",
    code: "food-basico",
    name: "Comércio Básico",
    description: "",
    prices: [{ id: "price-1", cycle: "MONTHLY", priceCents: 9900, status: "ACTIVE" }],
    vertical: "Comércio",
    tier: "basico",
    maxNegocios: 5,
    maxUsers: 10,
    maxProducts: 500,
    status: "ACTIVE",
    subscriberCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const PLANS: Plan[] = [
  buildPlan({ id: "plan-comercio", name: "Comércio Básico", vertical: "Comércio", tier: "basico" }),
  buildPlan({ id: "plan-clinica", name: "Clínica Prata", vertical: "Clínica", tier: "prata" }),
];

const NOOP = vi.fn();

describe("PlansGrid", () => {
  it("shows only plans from the selected vertical when filtered (US3)", () => {
    render(
      <PlansGrid
        plans={PLANS}
        search=""
        filters={{ vertical: ["Comércio"] }}
        onEdit={NOOP}
        onDuplicate={NOOP}
        onStatusChange={NOOP}
      />,
    );

    expect(screen.getByText("Comércio Básico")).toBeInTheDocument();
    expect(screen.queryByText("Clínica Prata")).not.toBeInTheDocument();
  });

  it("shows plans from every vertical when no filter is applied", () => {
    render(
      <PlansGrid
        plans={PLANS}
        search=""
        filters={{}}
        onEdit={NOOP}
        onDuplicate={NOOP}
        onStatusChange={NOOP}
      />,
    );

    expect(screen.getByText("Comércio Básico")).toBeInTheDocument();
    expect(screen.getByText("Clínica Prata")).toBeInTheDocument();
  });
});
