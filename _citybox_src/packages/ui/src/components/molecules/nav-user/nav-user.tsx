"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../atoms/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../atoms/sidebar";

export type NavUserLinkProps = React.PropsWithChildren<{
  href: string;
}> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export type NavUserLinkComponent = React.ComponentType<NavUserLinkProps>;

function DefaultNavUserLink({ href, children, ...props }: NavUserLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export interface NavUserMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onSelect?: () => void;
}

export interface NavUserMenuGroup {
  items: NavUserMenuItem[];
}

export interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  menuGroups?: NavUserMenuGroup[];
  variant?: "sidebar" | "header";
  buttonClassName?: string;
  menuClassName?: string;
  linkComponent?: NavUserLinkComponent;
  dropdownSide?: "top" | "right" | "bottom" | "left";
  dropdownAlign?: "start" | "center" | "end";
}

function UserIdentity({
  user,
  compact,
}: {
  user: NavUserProps["user"];
  compact?: boolean;
}) {
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <>
      <Avatar className={cn("rounded-lg", compact ? "size-8" : "h-8 w-8")}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "grid min-w-0 flex-1 text-left text-sm leading-tight",
          compact && "hidden md:grid",
        )}
      >
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </>
  );
}

function NavUserMenuItems({
  menuGroups,
  linkComponent: LinkComponent = DefaultNavUserLink,
}: {
  menuGroups: NavUserMenuGroup[];
  linkComponent?: NavUserLinkComponent;
}) {
  if (menuGroups.length === 0) return null;

  return menuGroups.map((group, groupIndex) => (
    <React.Fragment key={groupIndex}>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {group.items.map((item) => {
          const Icon = item.icon;

          if (item.href) {
            return (
              <DropdownMenuItem key={item.label} asChild>
                <LinkComponent href={item.href}>
                  {Icon ? <Icon /> : null}
                  {item.label}
                </LinkComponent>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
              {Icon ? <Icon /> : null}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuGroup>
    </React.Fragment>
  ));
}

type NavUserDropdownProps = Omit<NavUserProps, "variant" | "menuClassName"> & {
  trigger: React.ReactNode;
  contentClassName?: string;
};

function NavUserDropdown({
  user,
  menuGroups = [],
  trigger,
  linkComponent,
  dropdownSide,
  dropdownAlign = "end",
  contentClassName,
}: NavUserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn("min-w-56 rounded-lg", contentClassName)}
        side={dropdownSide}
        align={dropdownAlign}
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <UserIdentity user={user} />
          </div>
        </DropdownMenuLabel>
        <NavUserMenuItems menuGroups={menuGroups} linkComponent={linkComponent} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavUserSidebar({
  menuClassName,
  buttonClassName,
  dropdownSide,
  dropdownAlign,
  ...props
}: NavUserProps) {
  const { isMobile } = useSidebar();
  const side = dropdownSide ?? (isMobile ? "bottom" : "right");

  const trigger = (
    <SidebarMenuButton
      size="lg"
      className={cn(
        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0",
        buttonClassName,
      )}
    >
      <UserIdentity user={props.user} />
      <ChevronsUpDown className="ml-auto size-4" />
    </SidebarMenuButton>
  );

  return (
    <SidebarMenu className={menuClassName}>
      <SidebarMenuItem>
        <NavUserDropdown
          {...props}
          trigger={trigger}
          dropdownSide={side}
          dropdownAlign={dropdownAlign}
          contentClassName="w-(--radix-dropdown-menu-trigger-width)"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavUserHeader({
  buttonClassName,
  dropdownSide = "bottom",
  dropdownAlign = "end",
  ...props
}: NavUserProps) {
  const trigger = (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        buttonClassName,
      )}
    >
      <UserIdentity user={props.user} compact />
      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <NavUserDropdown
      {...props}
      trigger={trigger}
      dropdownSide={dropdownSide}
      dropdownAlign={dropdownAlign}
    />
  );
}

export function NavUser({ variant = "sidebar", ...props }: NavUserProps) {
  if (variant === "header") {
    return <NavUserHeader variant={variant} {...props} />;
  }

  return <NavUserSidebar variant={variant} {...props} />;
}
