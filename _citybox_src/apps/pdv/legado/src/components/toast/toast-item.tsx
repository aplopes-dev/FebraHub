'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangleIcon,
  CheckIcon,
  InfoIcon,
  XIcon,
} from 'lucide-react';
import type { ToastItemData, ToastVariant } from './toast-types';

type ToastItemProps = {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
};

const VARIANT_PROGRESS: Record<ToastVariant, string> = {
  error: 'linear-gradient(90deg, #F04D28 0%, #AA371C 100%)',
  success: 'linear-gradient(90deg, #4CAF50 0%, #2E7D32 100%)',
  warning: 'linear-gradient(90deg, #F59E0B 0%, #B45309 100%)',
  info: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)',
};

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  error: 'linear-gradient(145deg, #F04D28 0%, #AA371C 100%)',
  success: 'linear-gradient(145deg, #4CAF50 0%, #2E7D32 100%)',
  warning: 'linear-gradient(145deg, #F59E0B 0%, #B45309 100%)',
  info: 'linear-gradient(145deg, #3B82F6 0%, #1D4ED8 100%)',
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'error') {
    return (
      <Image
        src="/Sign-Icon.svg"
        alt=""
        width={32}
        height={32}
        unoptimized
        className="size-8 shrink-0"
      />
    );
  }

  const Icon =
    variant === 'success'
      ? CheckIcon
      : variant === 'warning'
        ? AlertTriangleIcon
        : InfoIcon;

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
      style={{ backgroundImage: VARIANT_ICON_BG[variant] }}
      aria-hidden
    >
      <Icon className="size-4" strokeWidth={2.5} />
    </span>
  );
}

/**
 * Item visual do Toast do PDV.
 * O timer só pausa enquanto o cursor está sobre o toast (`:hover`).
 */
export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const remainingMsRef = useRef(toast.durationMs);
  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const dismissedRef = useRef(false);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    dismissedRef.current = false;
    remainingMsRef.current = toast.durationMs;
    lastTsRef.current = null;
    setProgress(1);

    const tick = (now: number) => {
      if (dismissedRef.current) return;

      const isHovered = rootRef.current?.matches(':hover') === true;

      if (isHovered) {
        // Congela o tempo enquanto houver hover no toast
        lastTsRef.current = now;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTsRef.current == null) {
        lastTsRef.current = now;
      }

      const delta = now - lastTsRef.current;
      lastTsRef.current = now;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - delta);
      setProgress(remainingMsRef.current / toast.durationMs);

      if (remainingMsRef.current <= 0) {
        dismissedRef.current = true;
        onDismiss(toast.id);
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      dismissedRef.current = true;
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="pdv-toast-item relative w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start gap-3 px-4 pb-4 pt-4">
        <VariantIcon variant={toast.variant} />

        <div className="min-w-0 flex-1 pr-6">
          <p className="text-sm font-bold leading-5 text-[#171717]">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-5 text-[#737373]">
              {toast.description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Fechar notificação"
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]"
          onClick={() => onDismiss(toast.id)}
        >
          <XIcon className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="h-1 w-full bg-[#F0F0F0]">
        <div
          className="h-full origin-left"
          style={{
            width: `${Math.max(0, Math.min(100, progress * 100))}%`,
            backgroundImage: VARIANT_PROGRESS[toast.variant],
          }}
        />
      </div>
    </div>
  );
}
