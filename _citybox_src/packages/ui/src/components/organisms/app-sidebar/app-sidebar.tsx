"use client";

import * as React from "react";
import { Command } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../../atoms/sidebar";
import { Separator } from "../../atoms/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../atoms/breadcrumb";

export type SidebarLinkProps = React.PropsWithChildren<{
  href: string;
}> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export type SidebarLinkComponent = React.ComponentType<SidebarLinkProps>;

export function DefaultSidebarLink({ href, children, ...props }: SidebarLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export interface SidebarNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export interface AppSidebarProps {
  navItems?: SidebarNavItem[];
  navGroups?: SidebarNavGroup[];
  brandName?: string;
  brandSubtitle?: string;
  brandIcon?: React.ComponentType<{ className?: string }>;
  /** Full logo rendered when the sidebar is expanded. Replaces brandIcon + brandName + brandSubtitle. */
  brandLogo?: React.ReactNode;
  /** Compact logo rendered when the sidebar collapses to icon mode. Falls back to brandLogo. */
  brandLogoCollapsed?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  collapsible?: "offcanvas" | "icon";
  header?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  children?: React.ReactNode;
  linkComponent?: SidebarLinkComponent;
  /**
   * Limita o shell à altura da viewport (`h-svh`), fazendo o conteúdo (`main`)
   * rolar internamente em vez da página inteira — mesmo comportamento do
   * `AppSidebarDual`. Necessário para telas com scroll próprio (ex.: kanban).
   */
  fillViewport?: boolean;
}

export function AppSidebar({
  navItems,
  navGroups,
  brandName,
  brandSubtitle,
  brandIcon: BrandIcon = Command,
  brandLogo,
  brandLogoCollapsed,
  sidebarFooter,
  collapsible = "icon",
  header,
  breadcrumb,
  children,
  linkComponent: LinkComponent = DefaultSidebarLink,
  fillViewport = false,
}: AppSidebarProps) {
  const groups = navGroups ?? (navItems ? [{ label: "", items: navItems }] : []);

  return (
    <SidebarProvider
      className={fillViewport ? "h-svh overflow-hidden" : undefined}
      style={
        {
          "--sidebar-width": "256px",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible={collapsible}>
        <SidebarHeader>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              >
                <LinkComponent href="/">
                  {brandLogo ? (
                    <>
                      <div className="group-data-[collapsible=icon]:hidden">
                        {brandLogo}
                      </div>
                      <div className="hidden w-full group-data-[collapsible=icon]:flex items-center justify-center">
                        {brandLogoCollapsed ?? brandLogo}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BrandIcon className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{brandName}</span>
                        {brandSubtitle && (
                          <span className="truncate text-xs">{brandSubtitle}</span>
                        )}
                      </div>
                    </>
                  )}
                </LinkComponent>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.label || group.items[0]?.title}>
              {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.isActive}
                        tooltip={item.title}
                        className="h-10"
                      >
                        <LinkComponent href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </LinkComponent>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {sidebarFooter ? <SidebarFooter>{sidebarFooter}</SidebarFooter> : null}
      </Sidebar>

      <SidebarInset className={fillViewport ? "min-w-0" : undefined}>
        {header ?? (
          <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b bg-background p-4">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator
              orientation="vertical"
              className="mr-2 self-center data-vertical:h-4 data-vertical:self-center"
            />
            <div className="min-w-0 flex-1">
              {breadcrumb ?? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{brandSubtitle ?? brandName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
          </header>
        )}
        <main
          className={
            fillViewport
              ? "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4"
              : "flex flex-1 flex-col gap-4 p-4"
          }
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
