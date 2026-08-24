"use client";

import { formatClinicTimeFromIso } from "@/features/clinic/agenda/lib/clinic-datetime";
import { Lock } from "lucide-react";

import { EventDetailsPopover } from "@/features/clinic/agenda/components/event-details-popover";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface CommitmentBlockProps {
  event: IEvent;
  heightPx: number;
}

export function CommitmentBlock({ event, heightPx }: CommitmentBlockProps) {
  const isBusy = event.rawCommitment?.availability !== "available";
  const isShort = heightPx < 36;

  return (
    <EventDetailsPopover event={event}>
      <div
        role="button"
        tabIndex={0}
        className="w-full select-none overflow-hidden rounded-sm border border-dashed border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{
          height: `${Math.max(heightPx, 18)}px`,
          backgroundColor: isBusy
            ? "rgba(120,120,120,0.07)"
            : "rgba(34,197,94,0.06)",
          backgroundImage: isBusy
            ? "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.035) 5px, rgba(0,0,0,0.035) 10px)"
            : "none",
        }}
      >
        <div className={`flex items-center gap-1 px-2 ${isShort ? "h-full" : "pt-1"}`}>
          <Lock className="size-2.5 shrink-0 text-muted-foreground" />
          <p className="truncate text-[10px] font-medium text-muted-foreground">
            {event.title}
          </p>
        </div>

        {!isShort && (
          <p className="px-2 text-[10px] text-muted-foreground/70 tabular-nums">
            {formatClinicTimeFromIso(event.startDate)} – {formatClinicTimeFromIso(event.endDate)}
          </p>
        )}
      </div>
    </EventDetailsPopover>
  );
}
