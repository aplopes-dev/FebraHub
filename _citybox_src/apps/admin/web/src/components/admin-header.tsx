"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { BadgeCheck, LogOut } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  SidebarTrigger,
} from "@citybox/ui/atoms";
import { NavUser, type NavUserMenuGroup } from "@citybox/ui/molecules";
import type { AdminBreadcrumb } from "@/lib/admin-navigation";

type AdminHeaderProps = {
  pageTitle: string;
  breadcrumbs?: AdminBreadcrumb[] | null;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  onLogout: () => void;
  onProfile?: () => void;
  profileHref?: string;
  searchPlaceholder?: string;
};

export function AdminHeader({
  pageTitle,
  breadcrumbs,
  userName,
  userEmail,
  userAvatar = "",
  onLogout,
  onProfile,
  profileHref = "/profile",
}: AdminHeaderProps) {
  const menuGroups = useMemo((): NavUserMenuGroup[] => {
    const profileItem = onProfile
      ? { label: "Meu perfil", icon: BadgeCheck, onSelect: onProfile }
      : { label: "Meu perfil", icon: BadgeCheck, href: profileHref };

    return [
      { items: [profileItem] },
      { items: [{ label: "Sair", icon: LogOut, onSelect: onLogout }] },
    ];
  }, [onLogout, onProfile, profileHref]);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <Fragment key={`${item.label}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {item.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href} className="truncate">
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate font-semibold">
                          {item.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="truncate text-sm font-semibold">{pageTitle}</h1>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <NavUser
          variant="header"
          user={{ name: userName, email: userEmail, avatar: userAvatar }}
          menuGroups={menuGroups}
          linkComponent={Link}
        />
      </div>
    </header>
  );
}
