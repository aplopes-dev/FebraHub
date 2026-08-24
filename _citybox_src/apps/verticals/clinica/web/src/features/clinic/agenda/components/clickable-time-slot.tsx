"use client";

import { useSchedulingSheet } from "../contexts/scheduling-sheet-context";
import { useSchedulePermissions } from "../hooks/use-schedule-permissions";

type ClickableTimeSlotProps = {
  date: Date;
  hour: number;
  minute: number;
  className?: string;
  disabled?: boolean;
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ClickableTimeSlot({
  date,
  hour,
  minute,
  className,
  disabled,
}: ClickableTimeSlotProps) {
  const { openSheet } = useSchedulingSheet();
  const { canCreateScheduling } = useSchedulePermissions();

  if (disabled || !canCreateScheduling) {
    return <div className={className} />;
  }

  function handleClick() {
    const dateString = formatLocalDate(date);
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    openSheet({
      date: dateString,
      startTime: timeString,
    });
  }

  return (
    <div
      className={className}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    />
  );
}
