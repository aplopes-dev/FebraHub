"use client";

import { useDrop } from "react-dnd";
import { parseISO, differenceInMilliseconds } from "date-fns";

import { useUpdateEvent } from "@/features/clinic/agenda/hooks/use-update-event";

import { cn } from "@citybox/ui";
import { ItemTypes } from "@/features/clinic/agenda/components/dnd/draggable-event";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface DroppableTimeBlockProps {
  date: Date;
  hour: number;
  minute: number;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DroppableTimeBlock({
  date,
  hour,
  minute,
  children,
  disabled,
}: DroppableTimeBlockProps) {
  const { updateEvent } = useUpdateEvent();

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: IEvent }) => {
        const droppedEvent = item.event;

        const eventStartDate = parseISO(droppedEvent.startDate);
        const eventEndDate = parseISO(droppedEvent.endDate);

        const eventDurationMs = differenceInMilliseconds(
          eventEndDate,
          eventStartDate
        );

        const newStartDate = new Date(date);
        newStartDate.setHours(hour, minute, 0, 0);
        const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);

        updateEvent({
          ...droppedEvent,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });

        return { moved: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [date, hour, minute, updateEvent]
  );

  if (disabled) return <div className="h-[24px]">{children}</div>;

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={cn("h-[24px]", isOver && canDrop && "bg-accent/50")}
    >
      {children}
    </div>
  );
}
