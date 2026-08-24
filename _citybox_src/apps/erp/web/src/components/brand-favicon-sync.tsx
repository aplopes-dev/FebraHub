"use client";

import { useEffect } from "react";
import { brandFaviconDataUri } from "@/lib/brand-favicon";

const LINK_ATTR = "data-brand-favicon";

/**
 * Mantém o favicon alinhado à cor de marca ativa (tema / configurações da empresa).
 * O `app/icon.tsx` cobre o default no SSR; este sync cobre troca em runtime.
 */
export function BrandFaviconSync({ brandColor }: { brandColor: string }) {
  useEffect(() => {
    const href = brandFaviconDataUri(brandColor);
    let link = document.querySelector<HTMLLinkElement>(
      `link[rel="icon"][${LINK_ATTR}]`,
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.setAttribute(LINK_ATTR, "1");
      document.head.appendChild(link);
    }
    link.href = href;
  }, [brandColor]);

  return null;
}
