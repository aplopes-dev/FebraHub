'use client';

import { useEffect, useRef } from 'react';
import {
  Canvas,
  Circle,
  FabricObject,
  Group,
  Line,
  Triangle,
  type TPointerEventInfo,
} from 'fabric';

export type HofDrawTool = 'point' | 'arrow' | 'line' | 'eraser' | 'select';

type OdontogramHofDrawLayerProps = {
  active: boolean;
  tool: HofDrawTool;
  disabled?: boolean;
  annotations: unknown | null;
  onAnnotationsChange: (annotations: Record<string, unknown>) => void;
};

const STROKE = 'var(--primary, #2563eb)';
const STROKE_FALLBACK = '#2563eb';
const POINT_RADIUS = 5;
const LINE_WIDTH = 2.5;

function resolveStrokeColor(): string {
  if (typeof window === 'undefined') return STROKE_FALLBACK;
  const value = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  return value || STROKE_FALLBACK;
}

function createArrowGroup(x1: number, y1: number, x2: number, y2: number, color: string): Group {
  const line = new Line([x1, y1, x2, y2], {
    stroke: color,
    strokeWidth: LINE_WIDTH,
    selectable: false,
    evented: false,
  });

  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const head = new Triangle({
    left: x2,
    top: y2,
    originX: 'center',
    originY: 'center',
    width: 12,
    height: 14,
    fill: color,
    angle: angle + 90,
    selectable: false,
    evented: false,
  });

  return new Group([line, head], {
    selectable: true,
    evented: true,
    objectCaching: false,
  });
}

export function OdontogramHofDrawLayer({
  active,
  tool,
  disabled = false,
  annotations,
  onAnnotationsChange,
}: OdontogramHofDrawLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const toolRef = useRef(tool);
  const disabledRef = useRef(disabled);
  const activeRef = useRef(active);
  const drawingRef = useRef<{
    startX: number;
    startY: number;
    preview: FabricObject | null;
  } | null>(null);
  const skipNextEmitRef = useRef(false);
  const loadedJsonRef = useRef<string | null>(null);

  toolRef.current = tool;
  disabledRef.current = disabled;
  activeRef.current = active;

  const emitAnnotations = (canvas: Canvas) => {
    if (skipNextEmitRef.current) {
      skipNextEmitRef.current = false;
      return;
    }
    const json = canvas.toJSON();
    loadedJsonRef.current = JSON.stringify(json);
    onAnnotationsChange(json as Record<string, unknown>);
  };

  const applyToolMode = (canvas: Canvas, nextTool: HofDrawTool) => {
    const selectable = nextTool === 'select';
    canvas.selection = selectable;
    canvas.defaultCursor = nextTool === 'select' ? 'default' : 'crosshair';
    canvas.hoverCursor = nextTool === 'eraser' ? 'pointer' : selectable ? 'move' : 'crosshair';

    canvas.forEachObject((object) => {
      object.selectable = selectable;
      object.evented = nextTool === 'select' || nextTool === 'eraser';
      object.hasControls = selectable;
      object.hasBorders = selectable;
    });

    if (!selectable) {
      canvas.discardActiveObject();
    }
    canvas.requestRenderAll();
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvasEl = canvasElRef.current;
    if (!container || !canvasEl) return;

    const canvas = new Canvas(canvasEl, {
      selection: tool === 'select',
      preserveObjectStacking: true,
      backgroundColor: 'transparent',
      renderOnAddRemove: true,
    });
    canvasRef.current = canvas;

    const syncSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;
      canvas.setDimensions({ width, height });
      canvas.requestRenderAll();
    };

    syncSize();
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(container);

    const clearPreview = () => {
      if (drawingRef.current?.preview) {
        canvas.remove(drawingRef.current.preview);
        drawingRef.current.preview = null;
      }
    };

    const onMouseDown = (event: TPointerEventInfo) => {
      if (!activeRef.current || disabledRef.current) return;
      const currentTool = toolRef.current;
      const pointer = canvas.getScenePoint(event.e);

      if (currentTool === 'eraser') {
        const targetInfo = canvas.findTarget(event.e);
        const target = targetInfo.target ?? targetInfo.currentTarget;
        if (target) {
          canvas.remove(target);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          emitAnnotations(canvas);
        }
        return;
      }

      if (currentTool === 'select') return;

      if (currentTool === 'point') {
        const color = resolveStrokeColor();
        const point = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: POINT_RADIUS,
          originX: 'center',
          originY: 'center',
          fill: color,
          stroke: color,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        canvas.add(point);
        canvas.requestRenderAll();
        emitAnnotations(canvas);
        return;
      }

      drawingRef.current = {
        startX: pointer.x,
        startY: pointer.y,
        preview: null,
      };
    };

    const onMouseMove = (event: TPointerEventInfo) => {
      if (!activeRef.current || disabledRef.current) return;
      const draft = drawingRef.current;
      if (!draft) return;

      const currentTool = toolRef.current;
      if (currentTool !== 'line' && currentTool !== 'arrow') return;

      const pointer = canvas.getScenePoint(event.e);
      clearPreview();

      const color = resolveStrokeColor();
      const preview =
        currentTool === 'arrow'
          ? createArrowGroup(draft.startX, draft.startY, pointer.x, pointer.y, color)
          : new Line([draft.startX, draft.startY, pointer.x, pointer.y], {
              stroke: color,
              strokeWidth: LINE_WIDTH,
              selectable: false,
              evented: false,
            });

      preview.set({ selectable: false, evented: false });
      canvas.add(preview);
      draft.preview = preview;
      canvas.requestRenderAll();
    };

    const onMouseUp = (event: TPointerEventInfo) => {
      if (!activeRef.current || disabledRef.current) return;
      const draft = drawingRef.current;
      if (!draft) return;

      const currentTool = toolRef.current;
      const pointer = canvas.getScenePoint(event.e);
      clearPreview();
      drawingRef.current = null;

      const dx = pointer.x - draft.startX;
      const dy = pointer.y - draft.startY;
      if (Math.hypot(dx, dy) < 4) return;

      const color = resolveStrokeColor();
      if (currentTool === 'arrow') {
        canvas.add(createArrowGroup(draft.startX, draft.startY, pointer.x, pointer.y, color));
      } else if (currentTool === 'line') {
        canvas.add(
          new Line([draft.startX, draft.startY, pointer.x, pointer.y], {
            stroke: color,
            strokeWidth: LINE_WIDTH,
            selectable: false,
            evented: false,
          }),
        );
      } else {
        return;
      }

      applyToolMode(canvas, currentTool);
      canvas.requestRenderAll();
      emitAnnotations(canvas);
    };

    const onObjectModified = () => {
      emitAnnotations(canvas);
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:modified', onObjectModified);

    applyToolMode(canvas, toolRef.current);

    return () => {
      resizeObserver.disconnect();
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      canvas.off('object:modified', onObjectModified);
      canvas.dispose();
      canvasRef.current = null;
    };
    // Mount once — tool/active applied via refs + separate effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyToolMode(canvas, tool);
  }, [tool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.defaultCursor = active && !disabled ? (tool === 'select' ? 'default' : 'crosshair') : 'default';
    canvas.selection = active && !disabled && tool === 'select';
    canvas.skipTargetFind = !active || disabled;
    canvas.requestRenderAll();
  }, [active, disabled, tool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nextJson = annotations == null ? null : JSON.stringify(annotations);
    if (nextJson === loadedJsonRef.current) return;

    skipNextEmitRef.current = true;
    loadedJsonRef.current = nextJson;

    if (!annotations) {
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      applyToolMode(canvas, toolRef.current);
      canvas.requestRenderAll();
      return;
    }

    void canvas.loadFromJSON(annotations as Record<string, unknown>).then(() => {
      applyToolMode(canvas, toolRef.current);
      canvas.requestRenderAll();
    });
  }, [annotations]);

  return (
    <div
      ref={containerRef}
      className="hof-draw-layer"
      data-active={active ? 'true' : 'false'}
      aria-hidden={!active}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
}
