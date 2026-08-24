import { Badge } from "../../atoms/badge";
import { cn } from "../../../lib/utils";

/**
 * Uma entrada por vertical de `StoreVertical` (platform-api). O que não estiver aqui
 * cai no cinza do `DEFAULT_STYLE` — foi assim que "Clínica" ficou sem cor por um tempo.
 * Ao adicionar vertical nova no catálogo, adicione a cor **junto**.
 */
const VERTICAL_STYLES: Record<string, string> = {
  // Herda a cor que era de "Food": food e varejo viraram a mesma vertical, e o primary
  // segue sendo a identidade do ERP que atende os dois.
  "Comércio":
    "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15",
  // Cyan alinhado ao CLINIC_THEME (#0891b2) do clinica-web.
  "Clínica":
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-400",
  Imóveis:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400",
  Beautiful:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400",
};

const DEFAULT_STYLE =
  "border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50";

export interface VerticalBadgeProps {
  vertical: string;
  className?: string;
}

export function VerticalBadge({ vertical, className }: VerticalBadgeProps) {
  const styleClass = VERTICAL_STYLES[vertical] ?? DEFAULT_STYLE;

  return (
    <Badge variant="outline" className={cn("w-fit text-xs font-medium", styleClass, className)}>
      {vertical}
    </Badge>
  );
}
