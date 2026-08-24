import { format } from "date-fns";
import { useEffect, useState } from "react";

interface IProps {
  fromMinutes: number;
  toMinutes: number;
}

export function CalendarTimeline({ fromMinutes, toMinutes }: IProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const gridSpanMinutes = Math.max(toMinutes - fromMinutes, 1);

  if (minutes < fromMinutes || minutes >= toMinutes) return null;

  const top = ((minutes - fromMinutes) / gridSpanMinutes) * 100;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 border-t border-primary"
      style={{ top: `${top}%` }}
    >
      <div className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"></div>
      <div className="absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-muted/40 pr-1 text-[11px] font-semibold text-primary tabular-nums">
        {format(currentTime, "HH:mm")}
      </div>
    </div>
  );
}
