'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutOutlinedIcon from '@mui/icons-material/ZoomOutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { alpha, type Theme } from '@mui/material/styles';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.35;
/** Deslocamento horizontal mínimo (px) para confirmar troca de foto. */
const SWIPE_THRESHOLD_PX = 40;
/** Swipe mais horizontal que vertical. */
const SWIPE_AXIS_RATIO = 1.05;
/** Lock de eixo (px) antes de decidir se é swipe. */
const LOCK_PX = 8;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

type Point = { x: number; y: number };

type ZoomableImageProps = {
  src: string;
  alt: string;
  resetKey?: string | number;
  showControls?: boolean;
  className?: string;
  /**
   * Navegação por swipe (pointer/touch) com zoom em 100%.
   * Swipe para a esquerda → `onSwipeLeft` (próxima); direita → `onSwipeRight` (anterior).
   */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

const controlButtonSx = {
  width: 40,
  height: 40,
  bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.5),
  color: 'common.white',
  '&:hover': {
    bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.7),
  },
  '&.Mui-disabled': {
    opacity: 0.35,
    color: 'common.white',
  },
} as const;

type GestureKind = 'idle' | 'undecided' | 'swipe' | 'pan' | 'pinch';

/**
 * Imagem com zoom (pinça/botões) e swipe horizontal entre fotos.
 * Gestos via listeners nativos (não React synthetic) — mais confiáveis no mobile/Safari.
 */
export function ZoomableImage({
  src,
  alt,
  resetKey,
  showControls = true,
  className,
  onSwipeLeft,
  onSwipeRight,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  /** Feedback visual do arraste horizontal (só no modo swipe). */
  const [swipeDragX, setSwipeDragX] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const canSwipe = Boolean(onSwipeLeft || onSwipeRight);
  const canSwipeRef = useRef(canSwipe);
  canSwipeRef.current = canSwipe;
  const swipeLeftRef = useRef(onSwipeLeft);
  swipeLeftRef.current = onSwipeLeft;
  const swipeRightRef = useRef(onSwipeRight);
  swipeRightRef.current = onSwipeRight;

  const resetView = useCallback(() => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
    setSwipeDragX(0);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    resetView();
  }, [resetKey, src, resetView]);

  const applyScale = useCallback((next: number) => {
    const clamped = clampScale(next);
    setScale(clamped);
    if (clamped <= MIN_SCALE) {
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  const zoomIn = useCallback(() => {
    applyScale(scale + ZOOM_STEP);
  }, [applyScale, scale]);

  const zoomOut = useCallback(() => {
    applyScale(scale - ZOOM_STEP);
  }, [applyScale, scale]);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyScale(scale + delta);
    },
    [applyScale, scale],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const listener = (event: WheelEvent) => {
      event.preventDefault();
    };
    node.addEventListener('wheel', listener, { passive: false });
    return () => node.removeEventListener('wheel', listener);
  }, []);

  /**
   * Pointer-only nativo (mouse + touch + pen).
   * iOS 13+ emite PointerEvent; setPointerCapture no element garante o fim do gesto.
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let kind: GestureKind = 'idle';
    let pointerId: number | null = null;
    let start: Point = { x: 0, y: 0 };
    let panOrigin: Point = { x: 0, y: 0 };
    let pinchStartDistance = 0;
    let pinchStartScale = MIN_SCALE;

    const dist = (a: PointerEvent, b: PointerEvent) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    /** Pointers simultâneos (pinça). */
    const activePointers = new Map<number, PointerEvent>();

    const clear = () => {
      kind = 'idle';
      pointerId = null;
      setSwipeDragX(0);
      setIsPanning(false);
      activePointers.clear();
    };

    const finishSwipe = (clientX: number, clientY: number) => {
      const dx = clientX - start.x;
      const dy = clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      setSwipeDragX(0);

      if (
        scaleRef.current > MIN_SCALE + 0.05 ||
        absX < SWIPE_THRESHOLD_PX ||
        absX < absY * SWIPE_AXIS_RATIO
      ) {
        return;
      }

      if (dx < 0) {
        swipeLeftRef.current?.();
      } else {
        swipeRightRef.current?.();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;

      activePointers.set(event.pointerId, event);

      if (activePointers.size === 2) {
        kind = 'pinch';
        const [a, b] = Array.from(activePointers.values());
        pinchStartDistance = dist(a, b) || 1;
        pinchStartScale = scaleRef.current;
        setSwipeDragX(0);
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
        return;
      }

      if (activePointers.size !== 1) return;

      pointerId = event.pointerId;
      start = { x: event.clientX, y: event.clientY };
      panOrigin = { ...offsetRef.current };

      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      if (scaleRef.current > MIN_SCALE + 0.05) {
        kind = 'pan';
        setIsPanning(true);
      } else if (canSwipeRef.current) {
        kind = 'undecided';
      } else {
        kind = 'idle';
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, event);
      }

      if (kind === 'pinch' && activePointers.size >= 2) {
        if (event.cancelable) event.preventDefault();
        const [a, b] = Array.from(activePointers.values());
        const d = dist(a, b);
        if (pinchStartDistance > 0) {
          applyScale(pinchStartScale * (d / pinchStartDistance));
        }
        return;
      }

      if (pointerId != null && event.pointerId !== pointerId) return;
      if (kind === 'idle') return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (kind === 'undecided') {
        if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
        if (Math.abs(dx) >= Math.abs(dy) * SWIPE_AXIS_RATIO) {
          kind = 'swipe';
        } else {
          // Gesto vertical — desiste do swipe, deixa o browser
          kind = 'idle';
          setSwipeDragX(0);
          return;
        }
      }

      if (kind === 'swipe') {
        if (event.cancelable) event.preventDefault();
        setSwipeDragX(dx);
        return;
      }

      if (kind === 'pan') {
        if (event.cancelable) event.preventDefault();
        setOffset({
          x: panOrigin.x + dx,
          y: panOrigin.y + dy,
        });
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);

      if (kind === 'pinch') {
        if (activePointers.size < 2) {
          kind = 'idle';
          pointerId = null;
        }
        try {
          if (el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId);
          }
        } catch {
          // ignore
        }
        return;
      }

      if (pointerId != null && event.pointerId !== pointerId) return;

      if (kind === 'swipe') {
        finishSwipe(event.clientX, event.clientY);
      }

      try {
        if (el.hasPointerCapture(event.pointerId)) {
          el.releasePointerCapture(event.pointerId);
        }
      } catch {
        // ignore
      }

      clear();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('lostpointercapture', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('lostpointercapture', onPointerUp);
      clear();
    };
  }, [applyScale]);

  const cursor =
    scale > MIN_SCALE
      ? isPanning
        ? 'grabbing'
        : 'grab'
      : canSwipe
        ? 'grab'
        : 'zoom-in';

  return (
    <div className={`relative flex size-full min-h-0 flex-col ${className ?? ''}`}>
      <div
        ref={containerRef}
        role="img"
        aria-label={alt}
        className="relative flex flex-1 items-center justify-center overflow-hidden select-none"
        style={{
          cursor,
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        onWheel={onWheel}
        onDoubleClick={() => {
          if (scale > MIN_SCALE + 0.05) {
            resetView();
            return;
          }
          applyScale(2.5);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain will-change-transform"
          style={{
            transform: `translate(${offset.x + swipeDragX}px, ${offset.y}px) scale(${scale})`,
            transition: isPanning || swipeDragX !== 0 ? 'none' : 'transform 0.12s ease-out',
            touchAction: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {showControls ? (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 2,
            alignItems: 'center',
            borderRadius: 2,
            bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.45),
            p: 0.5,
          }}
        >
          <IconButton
            type="button"
            size="small"
            aria-label="Diminuir zoom"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            sx={controlButtonSx}
          >
            <ZoomOutOutlinedIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ minWidth: 40, textAlign: 'center', color: 'common.white', px: 0.5 }}
          >
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton
            type="button"
            size="small"
            aria-label="Aumentar zoom"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            sx={controlButtonSx}
          >
            <ZoomInOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            type="button"
            size="small"
            aria-label="Restaurar zoom"
            onClick={resetView}
            disabled={scale <= MIN_SCALE && offset.x === 0 && offset.y === 0}
            sx={controlButtonSx}
          >
            <RestartAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : null}
    </div>
  );
}

export { MIN_SCALE, MAX_SCALE, clampScale };
