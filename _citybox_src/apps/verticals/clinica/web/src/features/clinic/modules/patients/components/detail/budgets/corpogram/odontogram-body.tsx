"use client";

import {
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@citybox/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@citybox/ui/atoms";
import {
  ANATOMICAL_MAP_DEFAULT_SILHOUETTE_VARIANT,
  corpogramGenderToImcSilhouetteSex,
  patientImcSilhouetteSrc,
  type PatientImcSilhouetteVariant,
} from "@/lib/patient-imc";
import {
  CORPogram_VIEWBOX,
  corpogramGenderRegionsTransform,
  corpogramRegionGenderTransform,
  corpogramRegionsForView,
  defaultCorpogramGender,
  normalizeCorpogramRegionIds,
  type CorpogramGender,
  type CorpogramRegionShape,
  type CorpogramView,
} from "./corpogram-data";
import { MapGenderToggle } from "../maps/map-gender-toggle";
import {
  CORPogram_VIEW_OPTIONS,
  MapViewSwitcher,
} from "../maps/map-view-switcher";
import { CorpogramSelectionChips } from "./corpogram-selection-chips";
import "./corpogram.css";

type CorpogramTooltipState = {
  label: string;
  x: number;
  y: number;
} | null;

export type OdontogramBodyProps = {
  selectedRegionIds: readonly string[];
  listedRegionIds?: readonly string[];
  openRegionIds?: readonly string[];
  finalizedRegionIds?: readonly string[];
  /** Regiões com anotação clínica (mostra "!" roxo). */
  annotatedRegionIds?: readonly string[];
  /** Região com spinner / bloqueio de clique enquanto carrega anotações. */
  loadingRegionId?: string | null;
  readOnly?: boolean;
  disabled?: boolean;
  gender?: CorpogramGender;
  view?: CorpogramView;
  defaultPatientGender?: string | null;
  /** Variante visual IMC (`1`…`6`); padrão = saudável (`2`). */
  silhouetteVariant?: PatientImcSilhouetteVariant;
  onGenderChange?: (gender: CorpogramGender) => void;
  onViewChange?: (view: CorpogramView) => void;
  onRegionToggle: (regionId: string) => void;
  /**
   * Quando definido (ex.: aba Prontuário), o clique abre anotações
   * mesmo com `readOnly` — espelha `onToothOpen` do odontograma.
   */
  onRegionOpen?: (regionId: string) => void;
};

type CorpogramWorkspaceProps = OdontogramBodyProps & {
  interactive: boolean;
  expanded?: boolean;
  showControls?: boolean;
};

function expandBBox(
  box: { minX: number; minY: number; maxX: number; maxY: number } | null,
  x: number,
  y: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (!box) {
    return { minX: x, minY: y, maxX: x, maxY: y };
  }
  return {
    minX: Math.min(box.minX, x),
    minY: Math.min(box.minY, y),
    maxX: Math.max(box.maxX, x),
    maxY: Math.max(box.maxY, y),
  };
}

/** Offset em unidades do viewBox — "!" logo fora do canto da marcação. */
const ANNOTATION_MARK_OUTSET = 2.5;

/**
 * Extrai só endpoints visuais do path SVG (ignora pontos de controle de Bézier),
 * para o bbox do "!" acompanhar a silhueta desenhada e não os handles da curva.
 */
function pathEndpointCoordinates(
  pathD: string,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const commandRe = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;
  let currentX = 0;
  let currentY = 0;

  const readNumbers = (chunk: string): number[] =>
    chunk.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];

  while ((match = commandRe.exec(pathD)) !== null) {
    const command = match[1]!;
    const nums = readNumbers(match[2] ?? "");
    const absolute = command === command.toUpperCase();
    const type = command.toUpperCase();

    const push = (x: number, y: number) => {
      currentX = x;
      currentY = y;
      points.push({ x, y });
    };

    if (type === "Z") {
      continue;
    }

    if (type === "H") {
      for (const raw of nums) {
        push(absolute ? raw : currentX + raw, currentY);
      }
      continue;
    }

    if (type === "V") {
      for (const raw of nums) {
        push(currentX, absolute ? raw : currentY + raw);
      }
      continue;
    }

    // Pares (x,y): M/L usam todos; C/S/Q/T/A usam só o último par de cada segmento.
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      pairs.push([nums[i]!, nums[i + 1]!]);
    }

    if (type === "M" || type === "L" || type === "T") {
      for (const [rawX, rawY] of pairs) {
        push(
          absolute ? rawX : currentX + rawX,
          absolute ? rawY : currentY + rawY,
        );
      }
      continue;
    }

    if (type === "Q" || type === "S") {
      // Q: (cxy, end)*  S: (cxy, end)* — endpoint a cada 2 pares
      for (let i = 1; i < pairs.length; i += 2) {
        const [rawX, rawY] = pairs[i]!;
        push(
          absolute ? rawX : currentX + rawX,
          absolute ? rawY : currentY + rawY,
        );
      }
      continue;
    }

    if (type === "C") {
      // C: (c1, c2, end)* — endpoint a cada 3 pares
      for (let i = 2; i < pairs.length; i += 3) {
        const [rawX, rawY] = pairs[i]!;
        push(
          absolute ? rawX : currentX + rawX,
          absolute ? rawY : currentY + rawY,
        );
      }
      continue;
    }

    if (type === "A") {
      // A: rx ry rot large sweep x y — endpoint nos 2 últimos números de cada arco (7 nums)
      for (let i = 0; i + 6 < nums.length; i += 7) {
        const rawX = nums[i + 5]!;
        const rawY = nums[i + 6]!;
        push(
          absolute ? rawX : currentX + rawX,
          absolute ? rawY : currentY + rawY,
        );
      }
    }
  }

  return points;
}

/**
 * Posição do "!" de anotação: canto **superior direito**, fora da região.
 */
function regionAnnotationMarkPosition(
  region: CorpogramRegionShape,
  gender: CorpogramGender,
): { x: number; y: number } | null {
  let box: { minX: number; minY: number; maxX: number; maxY: number } | null =
    null;

  if (region.cx != null && region.cy != null && region.r != null) {
    box = expandBBox(box, region.cx - region.r, region.cy - region.r);
    box = expandBBox(box, region.cx + region.r, region.cy + region.r);
  }

  for (const ellipse of region.ellipses ?? []) {
    // Bounding box axis-aligned (rotação leve — suficiente para posicionar o "!").
    box = expandBBox(box, ellipse.cx - ellipse.rx, ellipse.cy - ellipse.ry);
    box = expandBBox(box, ellipse.cx + ellipse.rx, ellipse.cy + ellipse.ry);
  }

  for (const path of region.paths ?? []) {
    for (const point of pathEndpointCoordinates(path.d)) {
      box = expandBBox(box, point.x, point.y);
    }
  }

  if (region.points) {
    const coords = region.points
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    for (let i = 0; i + 1 < coords.length; i += 2) {
      const x = coords[i];
      const y = coords[i + 1];
      if (Number.isFinite(x) && Number.isFinite(y)) {
        box = expandBBox(box, x, y);
      }
    }
  }

  if (!box) return null;

  // Âncoras especiais: evita o "!" sumir na cueca/silhueta ou invadir região vizinha.
  // Vista frontal: *-direito = x baixo (esquerda da tela); *-esquerdo = x alto.
  if (region.id === "torax") {
    // Canto superior direito, um pouco para dentro — evita entrar no ombro esquerdo.
    return {
      x: box.maxX - 4,
      y: box.minY - 5,
    };
  }
  if (region.id === "abdomen") {
    return {
      x: box.maxX + 9,
      y: box.minY - 7,
    };
  }
  if (region.id === "atm-esquerda") {
    // Mais afastado à direita — o canto padrão fica sob o cabelo da silhueta.
    return {
      x: box.maxX + 7,
      y: box.minY - 7,
    };
  }
  if (region.id === "atm-direita") {
    return {
      x: box.minX - 6,
      y: box.minY - ANNOTATION_MARK_OUTSET,
    };
  }
  if (region.id === "tornozelo-pe-direito") {
    return {
      x: box.minX - ANNOTATION_MARK_OUTSET,
      y: box.minY - ANNOTATION_MARK_OUTSET,
    };
  }
  if (
    gender === "woman" &&
    (region.id === "ombro-direito" || region.id === "punho-mao-direito")
  ) {
    // Silhueta feminina: membros direitos (esquerda da tela) — "!" no canto superior esquerdo.
    return {
      x: box.minX - ANNOTATION_MARK_OUTSET,
      y: box.minY - ANNOTATION_MARK_OUTSET,
    };
  }
  if (region.id === "coxa-anterior-direita") {
    return {
      x: box.minX - ANNOTATION_MARK_OUTSET,
      y: box.maxY + ANNOTATION_MARK_OUTSET,
    };
  }
  if (region.id === "coxa-anterior-esquerda") {
    return {
      x: box.maxX + ANNOTATION_MARK_OUTSET,
      y: box.maxY + ANNOTATION_MARK_OUTSET,
    };
  }
  if (region.id === "quadril-direito") {
    return {
      x: box.minX - ANNOTATION_MARK_OUTSET,
      y: box.minY - ANNOTATION_MARK_OUTSET,
    };
  }

  return {
    x: box.maxX + ANNOTATION_MARK_OUTSET,
    y: box.minY - ANNOTATION_MARK_OUTSET,
  };
}

function CorpogramWorkspace({
  selectedRegionIds,
  listedRegionIds = [],
  openRegionIds = [],
  finalizedRegionIds = [],
  annotatedRegionIds = [],
  loadingRegionId = null,
  readOnly = false,
  disabled = false,
  gender: controlledGender,
  view: controlledView,
  defaultPatientGender,
  silhouetteVariant = ANATOMICAL_MAP_DEFAULT_SILHOUETTE_VARIANT,
  onGenderChange,
  onViewChange,
  onRegionToggle,
  onRegionOpen,
  interactive,
  expanded = false,
  showControls = true,
}: CorpogramWorkspaceProps) {
  const [internalGender, setInternalGender] = useState<CorpogramGender>(() =>
    defaultCorpogramGender(defaultPatientGender),
  );
  const [internalView, setInternalView] = useState<CorpogramView>("front");
  const [tooltip, setTooltip] = useState<CorpogramTooltipState>(null);

  const gender = controlledGender ?? internalGender;
  const view = controlledView ?? internalView;
  const selectedSet = new Set(normalizeCorpogramRegionIds(selectedRegionIds));
  const listedSet = new Set(normalizeCorpogramRegionIds(listedRegionIds));
  const openSet = new Set(normalizeCorpogramRegionIds(openRegionIds));
  const finalizedSet = new Set(normalizeCorpogramRegionIds(finalizedRegionIds));
  const annotatedSet = new Set(normalizeCorpogramRegionIds(annotatedRegionIds));
  const canToggle = interactive && !disabled && !readOnly;
  const canOpenNotes =
    Boolean(onRegionOpen) && !disabled && loadingRegionId == null;
  const canInteract = canToggle || canOpenNotes;
  const regions = corpogramRegionsForView(view);
  const silhouetteSrc = patientImcSilhouetteSrc(
    silhouetteVariant,
    corpogramGenderToImcSilhouetteSex(gender),
  );

  const setGender = (next: CorpogramGender) => {
    if (onGenderChange) {
      onGenderChange(next);
    } else {
      setInternalGender(next);
    }
  };

  const setView = (next: CorpogramView) => {
    if (onViewChange) {
      onViewChange(next);
    } else {
      setInternalView(next);
    }
  };

  return (
    <div className={cn("corpogram-view", expanded && "is-expanded")}>
      {showControls ? (
        <div className="corpogram-toolbar-row">
          <MapViewSwitcher
            view={view}
            options={CORPogram_VIEW_OPTIONS}
            disabled={disabled}
            ariaLabel="Vista do mapa anatômico"
            onChange={setView}
          />
          <MapGenderToggle
            gender={gender}
            disabled={disabled}
            onChange={setGender}
          />
        </div>
      ) : null}

      <div className="corpogram-canvas">
        <div className="corpogram-stage">
          <svg
            viewBox={CORPogram_VIEWBOX}
            className="corpogram-svg"
            aria-label={`Mapa anatômico (${view === "front" ? "frente" : "costas"})`}
            onMouseLeave={() => setTooltip(null)}
          >
            <image
              href={silhouetteSrc}
              x="0"
              y="0"
              width="200"
              height="480"
              preserveAspectRatio="xMidYMid meet"
              className="corpogram-silhouette-image"
              aria-hidden
            />

            <g transform={corpogramGenderRegionsTransform(gender)}>
              {regions.map((region) => {
                const isSelected =
                  selectedSet.has(region.id) || listedSet.has(region.id);
                const isOpen = openSet.has(region.id);
                const isFinalized = finalizedSet.has(region.id);
                const isAnnotated = annotatedSet.has(region.id);
                const isLoading = loadingRegionId === region.id;
                const genderOffsetTransform = corpogramRegionGenderTransform(
                  region.id,
                  gender,
                );
                const markPoint = regionAnnotationMarkPosition(region, gender);

                const activateRegion = () => {
                  if (isLoading || !canInteract) return;
                  if (onRegionOpen) {
                    onRegionOpen(region.id);
                    return;
                  }
                  if (canToggle) {
                    onRegionToggle(region.id);
                  }
                };

                const sharedProps = {
                  className: cn(
                    "corpogram-region",
                    isSelected && "is-selected",
                    isOpen && "is-open",
                    isFinalized && "is-finalized",
                    isAnnotated && "is-annotated",
                    isLoading && "is-loading",
                  ),
                  role: "button" as const,
                  tabIndex: canInteract && !isLoading ? 0 : -1,
                  "aria-label": region.label,
                  "aria-pressed": selectedSet.has(region.id),
                  onMouseEnter: (event: MouseEvent<SVGGeometryElement>) => {
                    if (!canInteract) return;
                    const target = event.currentTarget;
                    const svg = target.ownerSVGElement;
                    if (!svg) return;
                    const bounds = target.getBBox();
                    const point = svg.createSVGPoint();
                    point.x = bounds.x + bounds.width / 2;
                    point.y = bounds.y;
                    const screen = point.matrixTransform(
                      target.getScreenCTM() ?? undefined,
                    );
                    const wrap = svg.parentElement?.getBoundingClientRect();
                    if (!wrap) return;
                    setTooltip({
                      label: region.label,
                      x: screen.x - wrap.left,
                      y: screen.y - wrap.top,
                    });
                  },
                  onMouseLeave: () => setTooltip(null),
                  onClick: activateRegion,
                  onKeyDown: (event: KeyboardEvent<SVGGeometryElement>) => {
                    if (!canInteract || isLoading) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      activateRegion();
                    }
                  },
                };

                const shapes: ReactNode[] = [];

                if (region.ellipses && region.ellipses.length > 0) {
                  for (const [index, ellipse] of region.ellipses.entries()) {
                    const rotate =
                      ellipse.rotate != null
                        ? `rotate(${ellipse.rotate} ${ellipse.cx} ${ellipse.cy})`
                        : undefined;
                    const transform =
                      [genderOffsetTransform, rotate]
                        .filter(Boolean)
                        .join(" ") || undefined;
                    shapes.push(
                      <ellipse
                        key={`${region.id}-ellipse-${index}`}
                        cx={ellipse.cx}
                        cy={ellipse.cy}
                        rx={ellipse.rx}
                        ry={ellipse.ry}
                        transform={transform}
                        {...sharedProps}
                      />,
                    );
                  }
                } else if (region.paths && region.paths.length > 0) {
                  for (const [index, path] of region.paths.entries()) {
                    shapes.push(
                      <path
                        key={`${region.id}-path-${index}`}
                        d={path.d}
                        transform={genderOffsetTransform}
                        {...sharedProps}
                      />,
                    );
                  }
                } else if (
                  region.cx != null &&
                  region.cy != null &&
                  region.r != null
                ) {
                  shapes.push(
                    <circle
                      key={region.id}
                      cx={region.cx}
                      cy={region.cy}
                      r={region.r}
                      transform={genderOffsetTransform}
                      {...sharedProps}
                    />,
                  );
                } else {
                  shapes.push(
                    <polygon
                      key={region.id}
                      points={region.points ?? ""}
                      transform={genderOffsetTransform}
                      {...sharedProps}
                    />,
                  );
                }

                return (
                  <g
                    key={region.id}
                    data-region={region.id}
                    data-has-annotation={isAnnotated ? "true" : undefined}
                    data-loading={isLoading ? "true" : undefined}
                  >
                    {shapes}
                    {isAnnotated && markPoint ? (
                      <text
                        className="corpogram-annotation-mark"
                        x={markPoint.x}
                        y={markPoint.y}
                        transform={genderOffsetTransform}
                        aria-hidden
                      >
                        !
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>

          {tooltip ? (
            <div
              className="corpogram-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
              role="tooltip"
            >
              {tooltip.label}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function OdontogramBody(props: OdontogramBodyProps) {
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [gender, setGender] = useState<CorpogramGender>(() =>
    defaultCorpogramGender(props.defaultPatientGender),
  );
  const [view, setView] = useState<CorpogramView>("front");

  const resolvedGender = props.gender ?? gender;
  const resolvedView = props.view ?? view;

  const handleGenderChange = (next: CorpogramGender) => {
    props.onGenderChange?.(next);
    if (!props.gender) {
      setGender(next);
    }
  };

  const handleViewChange = (next: CorpogramView) => {
    props.onViewChange?.(next);
    if (!props.view) {
      setView(next);
    }
  };

  return (
    <div className="patient-budget-corpogram" data-testid="corpogram-body">
      <div className="corpogram-toolbar-row corpogram-toolbar-row--expand">
        <MapViewSwitcher
          view={resolvedView}
          options={CORPogram_VIEW_OPTIONS}
          disabled={props.disabled}
          ariaLabel="Vista do mapa anatômico"
          onChange={handleViewChange}
        />
        <div className="corpogram-toolbar-actions">
          <MapGenderToggle
            gender={resolvedGender}
            disabled={props.disabled}
            onChange={handleGenderChange}
          />
          <button
            type="button"
            className="corpogram-expand-btn"
            title="Expandir mapa anatômico"
            aria-label="Expandir mapa anatômico"
            disabled={props.disabled}
            onClick={() => setExpandedOpen(true)}
          >
            <Maximize2 className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <CorpogramWorkspace
        {...props}
        gender={resolvedGender}
        view={resolvedView}
        onGenderChange={handleGenderChange}
        onViewChange={handleViewChange}
        interactive
        showControls={false}
      />

      <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] gap-4 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Mapa anatômico</DialogTitle>
            <DialogDescription>
              Selecione as regiões corporais para o procedimento. Vista:{" "}
              {resolvedView === "front" ? "frente" : "costas"}.
            </DialogDescription>
          </DialogHeader>
          <div className="patient-budget-corpogram">
            <CorpogramWorkspace
              {...props}
              gender={resolvedGender}
              view={resolvedView}
              onGenderChange={handleGenderChange}
              onViewChange={handleViewChange}
              interactive
              expanded
            />
          </div>
        </DialogContent>
      </Dialog>

      {props.selectedRegionIds.length > 0 ? (
        <CorpogramSelectionChips
          selectedRegionIds={props.selectedRegionIds}
          disabled={props.disabled || props.readOnly}
          onRemove={
            props.readOnly
              ? undefined
              : (regionId) => props.onRegionToggle(regionId)
          }
        />
      ) : null}
    </div>
  );
}
