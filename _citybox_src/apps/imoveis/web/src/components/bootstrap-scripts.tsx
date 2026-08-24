import { ACCENT_BOOTSTRAP_SCRIPT } from '@/features/settings/data/accent-presets';
import {
  CATALOG_COLOR_MODE_BOOTSTRAP_SCRIPT,
  COLOR_MODE_BOOTSTRAP_SCRIPT,
} from '@/lib/color-mode-shared';

/**
 * Scripts blocking no HTML do RSC (não hidratar um Client Component no `<head>`).
 * Um client em `<head>` disputa o MetadataWrapper do Next 16 e gera
 * hydration mismatch (`hidden` / id extra).
 */
export function BootstrapScripts() {
  return (
    <>
      <script
        id="imoveis-accent-bootstrap"
        dangerouslySetInnerHTML={{ __html: ACCENT_BOOTSTRAP_SCRIPT }}
      />
      <script
        id="imoveis-color-mode-bootstrap"
        dangerouslySetInnerHTML={{ __html: COLOR_MODE_BOOTSTRAP_SCRIPT }}
      />
      <script
        id="imoveis-catalog-color-mode-bootstrap"
        dangerouslySetInnerHTML={{
          __html: CATALOG_COLOR_MODE_BOOTSTRAP_SCRIPT,
        }}
      />
    </>
  );
}
