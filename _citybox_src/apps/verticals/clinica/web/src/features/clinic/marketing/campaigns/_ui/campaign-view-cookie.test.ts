import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_VIEW_COOKIE_MAX_AGE_SEC,
  getCampaignViewCookieName,
} from "./campaign-view-cookie";

describe("campaign-view-cookie", () => {
  it("uses 30 minute TTL", () => {
    expect(CAMPAIGN_VIEW_COOKIE_MAX_AGE_SEC).toBe(30 * 60);
  });

  it("names cookie per campaign id", () => {
    expect(getCampaignViewCookieName("abc")).toBe("campaign_view_abc");
  });
});
