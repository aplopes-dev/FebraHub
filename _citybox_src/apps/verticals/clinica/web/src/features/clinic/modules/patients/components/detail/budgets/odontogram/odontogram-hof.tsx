'use client';

import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import Image from 'next/image';
import {
  Circle,
  Eraser,
  Maximize2,
  MousePointer2,
  MoveRight,
  Pencil,
  Shapes,
  Slash,
} from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { HOF_REGIONS, normalizeHofRegionIds, type HofPolygon } from './odontogram-data';
import {
  OdontogramHofDrawLayer,
  type HofDrawTool,
} from './odontogram-hof-draw-layer';
import { MapGenderToggle } from '../maps/map-gender-toggle';
import hofWoman from './assets/hof-face-mulher.png';
import hofMan from './assets/hof-face-homem.png';

type HofMode = 'regions' | 'draw';

type OdontogramHofProps = {
  gender: 'woman' | 'man';
  selectedRegionIds: readonly string[];
  listedRegionIds?: readonly string[];
  hofAnnotations?: unknown | null;
  onHofAnnotationsChange?: (annotations: unknown | null) => void;
  disabled?: boolean;
  onGenderChange: (gender: 'woman' | 'man') => void;
  onRegionToggle: (regionId: string) => void;
};

type HofTooltipState = {
  label: string;
  x: number;
  y: number;
} | null;

const DRAW_TOOLS: Array<{
  id: HofDrawTool;
  label: string;
  icon: typeof Circle;
  filled?: boolean;
}> = [
  { id: 'point', label: 'Ponto', icon: Circle, filled: true },
  { id: 'arrow', label: 'Seta', icon: MoveRight },
  { id: 'line', label: 'Risco', icon: Slash },
  { id: 'eraser', label: 'Borracha', icon: Eraser },
  { id: 'select', label: 'Selecionar', icon: MousePointer2 },
];

type HofWorkspaceProps = {
  gender: 'woman' | 'man';
  selectedRegionIds: readonly string[];
  listedRegionIds: readonly string[];
  hofAnnotations: unknown | null;
  onHofAnnotationsChange?: (annotations: unknown | null) => void;
  disabled: boolean;
  onGenderChange: (gender: 'woman' | 'man') => void;
  onRegionToggle: (regionId: string) => void;
  mode: HofMode;
  onModeChange: (mode: HofMode) => void;
  drawTool: HofDrawTool;
  onDrawToolChange: (tool: HofDrawTool) => void;
  interactive: boolean;
  showGenderControls: boolean;
  expanded?: boolean;
};

function HofWorkspace({
  gender,
  selectedRegionIds,
  listedRegionIds,
  hofAnnotations,
  onHofAnnotationsChange,
  disabled,
  onGenderChange,
  onRegionToggle,
  mode,
  onModeChange,
  drawTool,
  onDrawToolChange,
  interactive,
  showGenderControls,
  expanded = false,
}: HofWorkspaceProps) {
  const selectedSet = new Set(normalizeHofRegionIds(selectedRegionIds));
  const listedSet = new Set(normalizeHofRegionIds(listedRegionIds));
  const photo = gender === 'woman' ? hofWoman : hofMan;
  const [tooltip, setTooltip] = useState<HofTooltipState>(null);
  const isDrawMode = mode === 'draw';
  const canInteract = interactive && !disabled;

  return (
    <div className={cn('hof-view', expanded && 'is-expanded')}>
      {showGenderControls ? (
        <MapGenderToggle
          gender={gender}
          disabled={disabled}
          label="Sexo do rosto"
          womanLabel="Rosto feminino"
          manLabel="Rosto masculino"
          onChange={onGenderChange}
        />
      ) : null}

      <div className="hof-canvas">
        <div
          className={cn('hof-draw-tools', !(interactive && isDrawMode) && 'is-collapsed')}
          role="toolbar"
          aria-label="Ferramentas de desenho"
          aria-hidden={!(interactive && isDrawMode)}
        >
          {DRAW_TOOLS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn('hof-draw-tool', drawTool === item.id && 'is-active')}
                title={item.label}
                aria-label={item.label}
                aria-pressed={drawTool === item.id}
                tabIndex={interactive && isDrawMode ? 0 : -1}
                disabled={!canInteract || !isDrawMode}
                onClick={() => onDrawToolChange(item.id)}
              >
                <Icon
                  className="size-5"
                  strokeWidth={2.5}
                  fill={item.filled ? 'currentColor' : 'none'}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <div className="hof-photo-stage">
          <div className="hof-photo-wrap">
            <Image
              src={photo}
              alt={`Mapa facial (${gender === 'woman' ? 'feminino' : 'masculino'})`}
              draggable={false}
              priority={false}
            />

            <svg
              viewBox="0 0 364 344"
              className={cn('hof-photo-overlay', isDrawMode && 'is-draw-mode')}
              aria-label="Regiões HOF"
              aria-hidden={isDrawMode || !interactive}
              onMouseLeave={() => setTooltip(null)}
            >
              {HOF_REGIONS.flatMap((region) => {
                const isSelected = selectedSet.has(region.id) || listedSet.has(region.id);
                const sharedProps = {
                  className: cn('hof-region', isSelected && 'is-selected'),
                  role: 'button' as const,
                  tabIndex: canInteract && !isDrawMode ? 0 : -1,
                  'aria-label': region.label,
                  'aria-pressed': selectedSet.has(region.id),
                  onMouseEnter: (event: MouseEvent<SVGGeometryElement>) => {
                    if (!interactive || isDrawMode) return;
                    const target = event.currentTarget;
                    const svg = target.ownerSVGElement;
                    if (!svg) return;
                    const bounds = target.getBBox();
                    const point = svg.createSVGPoint();
                    point.x = bounds.x + bounds.width / 2;
                    point.y = bounds.y;
                    const screen = point.matrixTransform(svg.getScreenCTM() ?? undefined);
                    const wrap = svg.parentElement?.getBoundingClientRect();
                    if (!wrap) return;
                    setTooltip({
                      label: region.label,
                      x: screen.x - wrap.left,
                      y: screen.y - wrap.top,
                    });
                  },
                  onMouseLeave: () => setTooltip(null),
                  onClick: () => {
                    if (canInteract && !isDrawMode) {
                      onRegionToggle(region.id);
                    }
                  },
                  onKeyDown: (event: KeyboardEvent<SVGGeometryElement>) => {
                    if (!canInteract || isDrawMode) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRegionToggle(region.id);
                    }
                  },
                };

                if (region.ellipses && region.ellipses.length > 0) {
                  return region.ellipses.map((ellipse, index) => (
                    <ellipse
                      key={`${region.id}-${index}`}
                      {...sharedProps}
                      cx={ellipse.cx}
                      cy={ellipse.cy}
                      rx={ellipse.rx}
                      ry={ellipse.ry}
                      transform={
                        ellipse.rotate != null
                          ? `rotate(${ellipse.rotate} ${ellipse.cx} ${ellipse.cy})`
                          : undefined
                      }
                    />
                  ));
                }

                if (region.paths && region.paths.length > 0) {
                  return region.paths.flatMap((path, index) => [
                    <path
                      key={`${region.id}-hit-${index}`}
                      {...sharedProps}
                      className={cn(sharedProps.className, 'hof-region--curve-hit')}
                      d={path.d}
                    />,
                    <path
                      key={`${region.id}-${index}`}
                      className={cn('hof-region', 'hof-region--curve', isSelected && 'is-selected')}
                      d={path.d}
                      aria-hidden
                      tabIndex={-1}
                    />,
                  ]);
                }

                const polygonShapes: HofPolygon[] =
                  region.polygons && region.polygons.length > 0
                    ? region.polygons
                    : region.points
                      ? [{ points: region.points }]
                      : [];

                return polygonShapes.map((polygon, index) => (
                  <polygon
                    key={`${region.id}-${index}`}
                    {...sharedProps}
                    points={polygon.points}
                    transform={
                      polygon.rotate != null && polygon.cx != null && polygon.cy != null
                        ? `rotate(${polygon.rotate} ${polygon.cx} ${polygon.cy})`
                        : undefined
                    }
                  />
                ));
              })}
            </svg>

            {interactive ? (
              <OdontogramHofDrawLayer
                active={isDrawMode}
                tool={drawTool}
                disabled={disabled}
                annotations={hofAnnotations}
                onAnnotationsChange={(next) => onHofAnnotationsChange?.(next)}
              />
            ) : null}

            {interactive && !isDrawMode && tooltip ? (
              <div
                className="hof-tooltip"
                style={{ left: tooltip.x, top: tooltip.y }}
                role="tooltip"
              >
                {tooltip.label}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hof-mode-bar" role="group" aria-label="Modo HOF">
        <button
          type="button"
          className={cn('hof-mode-btn', mode === 'draw' && 'is-active')}
          aria-pressed={mode === 'draw'}
          disabled={!canInteract}
          onClick={() => {
            onModeChange('draw');
            setTooltip(null);
          }}
        >
          <Pencil className="size-4" aria-hidden />
          Desenhar
        </button>
        <button
          type="button"
          className={cn('hof-mode-btn', mode === 'regions' && 'is-active')}
          aria-pressed={mode === 'regions'}
          disabled={!canInteract}
          onClick={() => {
            onModeChange('regions');
            setTooltip(null);
          }}
        >
          <Shapes className="size-4" aria-hidden />
          Região
        </button>
      </div>
    </div>
  );
}

export function OdontogramHof({
  gender,
  selectedRegionIds,
  listedRegionIds = [],
  hofAnnotations = null,
  onHofAnnotationsChange,
  disabled = false,
  onGenderChange,
  onRegionToggle,
}: OdontogramHofProps) {
  const [mode, setMode] = useState<HofMode>('regions');
  const [drawTool, setDrawTool] = useState<HofDrawTool>('point');
  const [expanded, setExpanded] = useState(false);

  const workspaceProps: Omit<HofWorkspaceProps, 'interactive' | 'showGenderControls' | 'expanded'> =
    {
      gender,
      selectedRegionIds,
      listedRegionIds,
      hofAnnotations,
      onHofAnnotationsChange,
      disabled,
      onGenderChange,
      onRegionToggle,
      mode,
      onModeChange: setMode,
      drawTool,
      onDrawToolChange: setDrawTool,
    };

  return (
    <>
      <div className="hof-toolbar-row">
        <MapGenderToggle
          gender={gender}
          disabled={disabled}
          label="Sexo do rosto"
          womanLabel="Rosto feminino"
          manLabel="Rosto masculino"
          onChange={onGenderChange}
        />

        <button
          type="button"
          className="hof-expand-btn"
          title="Expandir mapa facial"
          aria-label="Expandir mapa facial"
          disabled={disabled}
          onClick={() => setExpanded(true)}
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
      </div>

      <HofWorkspace
        {...workspaceProps}
        interactive={!expanded}
        showGenderControls={false}
      />

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="flex max-h-[min(92dvh,48rem)] w-full max-w-3xl flex-col gap-0 overflow-y-auto p-0 pt-6 pb-6 sm:max-w-3xl">
          <DialogHeader className="min-w-0 shrink-0 space-y-0 px-6 pb-4">
            <DialogTitle>Mapa facial (HOF)</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização ampliada do mapa facial com regiões e ferramentas de desenho.
            </DialogDescription>
          </DialogHeader>

          <div className="patient-budget-odontogram px-6 pb-2">
            <HofWorkspace
              {...workspaceProps}
              interactive={expanded}
              showGenderControls
              expanded
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
