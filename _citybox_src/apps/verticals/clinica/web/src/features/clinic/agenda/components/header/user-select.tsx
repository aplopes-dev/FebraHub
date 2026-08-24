import { useEffect } from "react";
import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";
import { useSchedulePermissions } from "@/features/clinic/agenda/hooks/use-schedule-permissions";

import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";

export function UserSelect() {
  const { users, selectedUserId, setSelectedUserId } = useCalendar();
  const { canViewAll, memberId } = useSchedulePermissions();

  useEffect(() => {
    if (canViewAll) return;
    if (!memberId) return;
    if (selectedUserId !== memberId) {
      setSelectedUserId(memberId);
    }
  }, [canViewAll, memberId, selectedUserId, setSelectedUserId]);

  if (!users || !Array.isArray(users)) {
    return null;
  }

  const visibleUsers = canViewAll
    ? users
    : users.filter((user) => user.id === memberId);

  return (
    <Select
      value={canViewAll ? selectedUserId : (memberId ?? selectedUserId)}
      onValueChange={setSelectedUserId}
      disabled={!canViewAll && Boolean(memberId)}
    >
      <SelectTrigger className="w-full md:w-48">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        {canViewAll ? (
          <SelectItem value="all">
            <div className="flex items-center gap-1">
              <div className="flex items-center -space-x-2">
                {users.slice(0, 2).map((user) => (
                  <Avatar
                    key={user.id}
                    className="size-6 border-2 border-background text-xxs"
                  >
                    <AvatarImage
                      src={user.picturePath ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xxs">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {users.length > 2 && (
                  <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xxs">
                    +{users.length - 2}
                  </div>
                )}
              </div>
              Todos
            </div>
          </SelectItem>
        ) : null}

        {visibleUsers.map((user) => (
          <SelectItem key={user.id} value={user.id} className="flex-1">
            <div className="flex items-center gap-2">
              <Avatar key={user.id} className="size-6">
                <AvatarImage
                  src={user.picturePath ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback className="text-xxs">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>

              <p className="truncate">{user.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
