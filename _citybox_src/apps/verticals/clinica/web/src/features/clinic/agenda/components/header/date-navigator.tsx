import { ChevronLeft, ChevronRight } from "lucide-react";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { Button } from "@citybox/ui/atoms";

import { navigateDate } from "@/features/clinic/agenda/helpers";

export function DateNavigator() {
  const { selectedDate, setSelectedDate, view } = useCalendar();

  if (
    !selectedDate ||
    !(selectedDate instanceof Date) ||
    isNaN(selectedDate.getTime())
  ) {
    return null;
  }

  const handlePrevious = () =>
    setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () =>
    setSelectedDate(navigateDate(selectedDate, view, "next"));

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size={"icon"}
          className="px-0 [&_svg]:size-4.5"
          onClick={handlePrevious}
        >
          <ChevronLeft />
        </Button>

        <Button
          variant="outline"
          size={"icon"}
          className="px-0 [&_svg]:size-4.5"
          onClick={handleNext}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
