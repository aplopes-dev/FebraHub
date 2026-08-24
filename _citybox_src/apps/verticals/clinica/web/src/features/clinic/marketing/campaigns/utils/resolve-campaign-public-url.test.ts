import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveCampaignPublicUrl } from "./resolve-campaign-public-url";

describe("resolveCampaignPublicUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers clinicId + slug over publicUrl", () => {
    vi.stubGlobal("window", { location: { origin: "https://app.example.com" } });
    expect(
      resolveCampaignPublicUrl({
        clinicId: "store-1",
        slug: "form-leads",
        publicUrl: "/campanha/other/slug",
      }),
    ).toBe("https://app.example.com/campanha/store-1/form-leads");
  });

  it("uses publicUrl path when clinicId/slug missing", () => {
    vi.stubGlobal("window", { location: { origin: "https://app.example.com" } });
    expect(
      resolveCampaignPublicUrl({
        publicUrl: "/campanha/store-1/form-leads",
      }),
    ).toBe("https://app.example.com/campanha/store-1/form-leads");
  });

  it("keeps absolute http(s) URLs", () => {
    expect(
      resolveCampaignPublicUrl({
        publicUrl: "https://cdn.example.com/campanha/x",
      }),
    ).toBe("https://cdn.example.com/campanha/x");
  });

  it("rejects non-http schemes", () => {
    expect(
      resolveCampaignPublicUrl({ publicUrl: "javascript:alert(1)" }),
    ).toBeNull();
  });

  it("returns null when no URL data", () => {
    expect(resolveCampaignPublicUrl({})).toBeNull();
  });
});
