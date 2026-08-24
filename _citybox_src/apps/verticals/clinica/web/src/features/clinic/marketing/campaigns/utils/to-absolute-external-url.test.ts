import { describe, expect, it } from "vitest";
import { toAbsoluteExternalUrl } from "./to-absolute-external-url";

describe("toAbsoluteExternalUrl", () => {
  it("adds https when protocol is missing", () => {
    expect(toAbsoluteExternalUrl("www.instagram.com.br")).toBe(
      "https://www.instagram.com.br",
    );
  });

  it("keeps http/https absolute urls", () => {
    expect(toAbsoluteExternalUrl("https://instagram.com/x")).toBe(
      "https://instagram.com/x",
    );
    expect(toAbsoluteExternalUrl("http://example.com")).toBe(
      "http://example.com",
    );
  });

  it("keeps app-relative paths", () => {
    expect(toAbsoluteExternalUrl("/obrigado")).toBe("/obrigado");
  });
});
