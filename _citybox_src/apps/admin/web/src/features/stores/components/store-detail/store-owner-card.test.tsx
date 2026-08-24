import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils";
import { StoreOwnerCard } from "./store-owner-card";

const {
  fetchVerticalOwnerMock,
  resetVerticalOwnerPasswordMock,
  provisionPlatformStoreMock,
} = vi.hoisted(() => ({
  fetchVerticalOwnerMock: vi.fn(),
  resetVerticalOwnerPasswordMock: vi.fn(),
  provisionPlatformStoreMock: vi.fn(),
}));

vi.mock("@/lib/admin-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-api")>("@/lib/admin-api");
  return {
    ...actual,
    fetchVerticalOwner: fetchVerticalOwnerMock,
    resetVerticalOwnerPassword: resetVerticalOwnerPasswordMock,
    provisionPlatformStore: provisionPlatformStoreMock,
  };
});

const OWNER_DTO = {
  id: "owner-1",
  username: "nascimento",
  firstName: "Ana",
  lastName: "Nascimento",
  email: "ana@clinica.test",
  status: "active" as const,
  organizationRole: "OWNER",
  organizationRoleLabel: "Responsável",
  isOrganizationOwner: true,
  hasPassword: false,
  provisionalExpiresAt: null,
  disabledAt: null,
  clinics: [],
};

const BASE_PROPS = {
  storeId: "store-1",
  teamSource: "vertical" as const,
  vertical: "Clínica" as const,
  responsibleName: "Ana Nascimento",
  billingEmail: "ana@clinica.test",
};

describe("StoreOwnerCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Provisionar when deployment is PENDING", async () => {
    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="PENDING" />,
    );

    expect(await screen.findByRole("button", { name: /provisionar/i })).toBeInTheDocument();
    expect(screen.getByText("Ana Nascimento")).toBeInTheDocument();
    expect(screen.getByText(/username: ana/i)).toBeInTheDocument();
    expect(fetchVerticalOwnerMock).not.toHaveBeenCalled();
  });

  it("opens confirm modal and provisions with credentials", async () => {
    const user = userEvent.setup();
    provisionPlatformStoreMock.mockResolvedValue({
      username: "ana",
      provisionalPassword: "Prov1sor1a!",
    });

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="PENDING" />,
    );

    await user.click(await screen.findByRole("button", { name: /provisionar/i }));
    expect(await screen.findByText(/provisionar acesso do responsável/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(await screen.findByText("Prov1sor1a!")).toBeInTheDocument();
    expect(provisionPlatformStoreMock).toHaveBeenCalledWith("store-1");
  });

  it("shows who the responsible is when ACTIVE", async () => {
    fetchVerticalOwnerMock.mockResolvedValue({ owner: OWNER_DTO });

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="ACTIVE" />,
    );

    expect(await screen.findByText("Ana Nascimento")).toBeInTheDocument();
    expect(screen.getByText("@nascimento")).toBeInTheDocument();
    expect(fetchVerticalOwnerMock).toHaveBeenCalledWith("store-1");
  });

  it("offers to generate the password when ACTIVE and never had one", async () => {
    fetchVerticalOwnerMock.mockResolvedValue({ owner: OWNER_DTO });

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="ACTIVE" />,
    );

    expect(await screen.findByRole("button", { name: /gerar senha/i })).toBeInTheDocument();
  });

  it("offers to generate a new password when one already exists", async () => {
    fetchVerticalOwnerMock.mockResolvedValue({
      owner: { ...OWNER_DTO, hasPassword: true },
    });

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="ACTIVE" />,
    );

    expect(await screen.findByRole("button", { name: /gerar nova senha/i })).toBeInTheDocument();
  });

  it("shows the provisional credentials once, in the dialog", async () => {
    const user = userEvent.setup();
    fetchVerticalOwnerMock.mockResolvedValue({ owner: OWNER_DTO });
    resetVerticalOwnerPasswordMock.mockResolvedValue({
      memberId: "owner-1",
      username: "nascimento",
      provisionalPassword: "Prov1sor1a!",
    });

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="ACTIVE" />,
    );
    await user.click(await screen.findByRole("button", { name: /gerar senha/i }));

    expect(await screen.findByText("Prov1sor1a!")).toBeInTheDocument();
    expect(resetVerticalOwnerPasswordMock).toHaveBeenCalledWith("store-1");
  });

  it("says the vertical could not be reached instead of showing an empty card", async () => {
    fetchVerticalOwnerMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    renderWithProviders(
      <StoreOwnerCard {...BASE_PROPS} deploymentStatus="ACTIVE" />,
    );

    expect(
      await screen.findByText(/não foi possível consultar o responsável/i),
    ).toBeInTheDocument();
  });

  it("still shows the card for platform teamSource when PENDING", async () => {
    renderWithProviders(
      <StoreOwnerCard
        {...BASE_PROPS}
        teamSource="platform"
        deploymentStatus="PENDING"
      />,
    );

    expect(await screen.findByRole("button", { name: /provisionar/i })).toBeInTheDocument();
  });
});
