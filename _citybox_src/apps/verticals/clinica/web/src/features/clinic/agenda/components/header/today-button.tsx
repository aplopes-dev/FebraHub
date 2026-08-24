import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { Button } from "@citybox/ui/atoms";

export function TodayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();
  const handleClick = () => setSelectedDate(today);

  return (
    <Button variant="ghost" onClick={handleClick}>
      Hoje
    </Button>
  );
}
