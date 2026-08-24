"use client";

import * as React from "react";
import { Command, PanelLeftClose } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../../atoms/sidebar";
import { Separator } from "../../atoms/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../atoms/breadcrumb";
import { cn } from "../../../lib/utils";
import { NavUser, type NavUserProps } from "../../molecules/nav-user";
import type {
  SidebarLinkComponent,
  SidebarNavGroup,
  SidebarNavItem,
} from "./app-sidebar";
import { DefaultSidebarLink } from "./app-sidebar";

/** Slots de classe para customização por vertical sem alterar o componente base. */
export type AppSidebarDualClassNames = {
  provider?: string;
  iconRail?: string;
  iconRailMenuButton?: string;
  /** Use variantes `data-[active=true]:` para estilizar o item ativo do rail. */
  iconRailMenuButtonActive?: string;
  panel?: string;
  /** Barra superior do conteúdo principal (breadcrumb / ações). */
  header?: string;
  /** Área de conteúdo abaixo do header (`<main>` interno). */
  main?: string;
};

export type AppSidebarDualRailVariant = "icon-only" | "expandable";

export interface AppSidebarDualProps {
  /** Itens flat do rail. Ignorado se `navGroups` for informado. */
  navItems?: SidebarNavItem[];
  /** Seções do rail (label + items). Preferido quando há grupos como "Menu" / "Canais". */
  navGroups?: SidebarNavGroup[];
  /** Itens no rodapé do rail (acima do NavUser). */
  footerNavItems?: SidebarNavItem[];
  brandName: string;
  brandSubtitle?: string;
  /** Ícone legado: ComponentType renderizado dentro de um <a> com bg-primary. */
  brandIcon?: React.ComponentType<{ className?: string }>;
  /** Substitui o bloco inteiro do logo — use para LogoBrand ou imagens customizadas. */
  brandNode?: React.ReactNode;
  /**
   * Logo compacta quando o rail está só ícones (painel aberto / `railVariant` não expandido).
   * Se omitido, usa `brandNode`.
   */
  brandNodeCollapsed?: React.ReactNode;
  /**
   * Usuário do rodapé do rail. Quando omitido, o `NavUser` **não** é renderizado
   * (ex.: erp-comercio move o user para o header).
   */
  user?: NavUserProps["user"];
  panelSearchPlaceholder?: string;
  /** Quando `false`, oculta o `SidebarInput` do painel. Default `true`. */
  showPanelSearch?: boolean;
  /**
   * `icon-only` (default): rail sempre só ícones — comportamento legado food/varejo.
   * `expandable`: rail sempre só ícones; painel (coluna 2) abre/fecha sem expandir o rail.
   * Clique em item com `hasPanel` só abre o painel (sem navegar).
   */
  railVariant?: AppSidebarDualRailVariant;
  /**
   * Controle externo do painel (coluna 2). Quando omitido, o Dual gerencia
   * internamente (abre ao selecionar item no modo `icon-only`).
   */
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  /**
   * Indica se o item do rail deve abrir a coluna 2. Default: sempre `true`
   * no modo `icon-only`; no `expandable`, o consumidor deve informar.
   *
   * No modo `expandable`, itens com painel **não navegam** ao clicar no rail —
   * só abrem a coluna 2. Itens sem painel continuam como link. No `icon-only`,
   * o rail sempre navega (legado).
   */
  hasPanel?: (item: SidebarNavItem) => boolean;
  /** Chamado ao selecionar um item do rail (além de atualizar active/painel). */
  onRailItemSelect?: (item: SidebarNavItem) => void;
  /**
   * Label do botão de fechar a coluna 2 (só `expandable` + painel aberto).
   * Fica acima de `footerNavItems`. Default: "Fechar menu".
   */
  panelCloseLabel?: string;
  /** Ícone do botão de fechar o painel. Default: `PanelLeftClose`. */
  panelCloseIcon?: React.ComponentType<{ className?: string }>;
  linkComponent?: SidebarLinkComponent;
  renderPanelHeader?: (activeItem: SidebarNavItem) => React.ReactNode;
  renderPanelContent?: (activeItem: SidebarNavItem) => React.ReactNode;
  breadcrumb?: React.ReactNode;
  /**
   * Quando `true`, o header não renderiza o trigger/separador/padding padrão — a
   * vertical fornece a barra inteira (incluindo seu próprio gatilho de menu) via `breadcrumb`.
   */
  headerFullBleed?: boolean;
  children?: React.ReactNode;
  /** Identificador da vertical — expõe `data-vertical-sidebar` no provider para CSS escopado. */
  verticalSidebarId?: string;
  classNames?: AppSidebarDualClassNames;
}

function flattenNavItems(
  navGroups: SidebarNavGroup[] | undefined,
  navItems: SidebarNavItem[] | undefined,
): SidebarNavItem[] {
  if (navGroups && navGroups.length > 0) {
    return navGroups.flatMap((group) => group.items);
  }
  return navItems ?? [];
}

function resolveActiveItem(
  items: SidebarNavItem[],
  footerItems: SidebarNavItem[],
): SidebarNavItem | undefined {
  const all = [...items, ...footerItems];
  return all.find((i) => i.isActive) ?? items[0] ?? footerItems[0];
}

type DualInnerProps = Omit<
  AppSidebarDualProps,
  "breadcrumb" | "children" | "verticalSidebarId" | "headerFullBleed"
>;

function AppSidebarDualInner({
  navItems,
  navGroups,
  footerNavItems = [],
  brandIcon: BrandIcon = Command,
  brandNode,
  brandNodeCollapsed,
  user,
  panelSearchPlaceholder = "Buscar...",
  showPanelSearch = true,
  railVariant = "icon-only",
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  hasPanel,
  onRailItemSelect,
  panelCloseLabel = "Fechar menu",
  panelCloseIcon: PanelCloseIcon = PanelLeftClose,
  linkComponent: LinkComponent = DefaultSidebarLink,
  renderPanelHeader,
  renderPanelContent,
  classNames,
}: DualInnerProps) {
  const flatItems = React.useMemo(
    () => flattenNavItems(navGroups, navItems),
    [navGroups, navItems],
  );
  const groups: SidebarNavGroup[] = React.useMemo(() => {
    if (navGroups && navGroups.length > 0) return navGroups;
    return [{ label: "", items: navItems ?? [] }];
  }, [navGroups, navItems]);

  const [activeItem, setActiveItem] = React.useState<SidebarNavItem | undefined>(
    () => resolveActiveItem(flatItems, footerNavItems),
  );

  React.useEffect(() => {
    const next = resolveActiveItem(flatItems, footerNavItems);
    if (next) setActiveItem(next);
  }, [flatItems, footerNavItems]);

  const { open, setOpen } = useSidebar();
  const isExpandable = railVariant === "expandable";
  const [uncontrolledPanelOpen, setUncontrolledPanelOpen] = React.useState(
    () => panelOpenProp ?? !isExpandable,
  );
  const panelOpen = panelOpenProp ?? (isExpandable ? uncontrolledPanelOpen : open);
  const setPanelOpen = React.useCallback(
    (next: boolean) => {
      onPanelOpenChange?.(next);
      if (panelOpenProp !== undefined) return;
      if (isExpandable) {
        setUncontrolledPanelOpen(next);
        return;
      }
      setOpen(next);
    },
    [onPanelOpenChange, panelOpenProp, isExpandable, setOpen],
  );

  const itemHasPanel = React.useCallback(
    (item: SidebarNavItem) => {
      if (hasPanel) return hasPanel(item);
      return !isExpandable;
    },
    [hasPanel, isExpandable],
  );

  const handleSelect = React.useCallback(
    (item: SidebarNavItem) => {
      setActiveItem(item);
      const openPanel = itemHasPanel(item);
      setPanelOpen(openPanel);
      onRailItemSelect?.(item);
    },
    [itemHasPanel, setPanelOpen, onRailItemSelect],
  );

  /**
   * Expandable: rail **sempre** comprimido (só ícones). A coluna 2 abre/fecha
   * sem expandir a coluna 1. Icon-only: mesmo visual de rail.
   */
  const railExpanded = false;

  const renderRailButton = (item: SidebarNavItem) => {
    const isActive = activeItem?.title === item.title;
    const iconOnly = !railExpanded;
    /** Expandable + módulo com painel: só abre coluna 2, sem navegar. */
    const openPanelOnly = isExpandable && itemHasPanel(item);

    if (iconOnly) {
      if (openPanelOnly) {
        return (
          <SidebarMenuButton
            type="button"
            tooltip={{ children: item.title, hidden: false }}
            isActive={isActive}
            className={cn(
              "!size-11 !w-11 justify-center !p-0 transition-none",
              classNames?.iconRailMenuButton,
              classNames?.iconRailMenuButtonActive,
            )}
            onClick={() => handleSelect(item)}
          >
            <item.icon className="!size-5" />
          </SidebarMenuButton>
        );
      }

      return (
        <SidebarMenuButton
          tooltip={{ children: item.title, hidden: false }}
          isActive={isActive}
          className={cn(
            "!size-11 !w-11 justify-center !p-0 transition-none",
            classNames?.iconRailMenuButton,
            classNames?.iconRailMenuButtonActive,
          )}
          asChild
        >
          <LinkComponent
            href={item.url}
            onClick={() => handleSelect(item)}
            className="flex size-11 items-center justify-center"
          >
            <item.icon className="!size-5" />
          </LinkComponent>
        </SidebarMenuButton>
      );
    }

    if (openPanelOnly) {
      return (
        <SidebarMenuButton
          type="button"
          isActive={isActive}
          className={cn(
            "h-10 w-full justify-start gap-3 px-3 transition-none",
            classNames?.iconRailMenuButton,
            classNames?.iconRailMenuButtonActive,
          )}
          onClick={() => handleSelect(item)}
        >
          <item.icon className="!size-5 shrink-0" />
          <span className="truncate">{item.title}</span>
        </SidebarMenuButton>
      );
    }

    return (
      <SidebarMenuButton
        isActive={isActive}
        className={cn(
          "h-10 w-full justify-start gap-3 px-3 transition-none",
          classNames?.iconRailMenuButton,
          classNames?.iconRailMenuButtonActive,
        )}
        asChild
      >
        <LinkComponent href={item.url} onClick={() => handleSelect(item)}>
          <item.icon className="!size-5 shrink-0" />
          <span className="truncate">{item.title}</span>
        </LinkComponent>
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    >
      <Sidebar
        collapsible="none"
        data-icon-rail
        data-rail-expanded={railExpanded ? "" : undefined}
        className={cn(
          "shrink-0 border-r transition-[width] duration-200 ease-linear",
          railExpanded ? "w-64!" : "w-(--sidebar-width-icon)!",
          !railExpanded &&
            "[&_[data-sidebar=menu-button]]:!size-11 [&_[data-sidebar=menu-button]]:!w-11 [&_[data-sidebar=menu-button]]:!p-0 [&_[data-sidebar=menu-button]]:transition-none",
          classNames?.iconRail,
        )}
      >
        <SidebarHeader
          className={cn(
            "flex py-4",
            railExpanded
              ? "items-start px-4"
              : "items-center justify-center px-0",
          )}
        >
          {brandNode ? (
            railExpanded ? brandNode : (brandNodeCollapsed ?? brandNode)
          ) : (
            <a
              href="#"
              className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <BrandIcon className="size-5" />
            </a>
          )}
        </SidebarHeader>

        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup
              key={group.label || "main"}
              className={railExpanded ? "px-2" : undefined}
            >
              {railExpanded && group.label ? (
                <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent
                className={cn(
                  "flex flex-col",
                  railExpanded ? "px-0" : "items-center px-0",
                )}
              >
                <SidebarMenu
                  className={cn(railExpanded ? "gap-1" : "items-center gap-1.5")}
                >
                  {group.items.map((item) => (
                    <SidebarMenuItem
                      key={item.title}
                      className={railExpanded ? undefined : "flex justify-center"}
                    >
                      {renderRailButton(item)}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter
          className={cn(
            "flex flex-col gap-1",
            railExpanded ? "items-stretch px-2 pb-2" : "items-center px-0",
          )}
        >
          {isExpandable && panelOpen ? (
            <SidebarMenu
              className={cn(railExpanded ? "gap-1" : "items-center gap-1.5")}
            >
              <SidebarMenuItem
                className={railExpanded ? undefined : "flex justify-center"}
              >
                {railExpanded ? (
                  <SidebarMenuButton
                    type="button"
                    className={cn(
                      "h-10 w-full justify-start gap-3 px-3 transition-none",
                      classNames?.iconRailMenuButton,
                    )}
                    onClick={() => setPanelOpen(false)}
                  >
                    <PanelCloseIcon className="!size-5 shrink-0" />
                    <span className="truncate">{panelCloseLabel}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    type="button"
                    tooltip={{ children: panelCloseLabel, hidden: false }}
                    className={cn(
                      "!size-11 !w-11 justify-center !p-0 transition-none",
                      classNames?.iconRailMenuButton,
                    )}
                    onClick={() => setPanelOpen(false)}
                  >
                    <PanelCloseIcon className="!size-5" />
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          ) : null}
          {footerNavItems.length > 0 ? (
            <SidebarMenu
              className={cn(railExpanded ? "gap-1" : "items-center gap-1.5")}
            >
              {footerNavItems.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={railExpanded ? undefined : "flex justify-center"}
                >
                  {renderRailButton(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : null}
          {user ? (
            <NavUser
              user={user}
              buttonClassName={
                railExpanded
                  ? undefined
                  : "!size-11 !w-11 justify-center !p-0 transition-none group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!w-11 group-data-[collapsible=icon]:!p-0 [&>div]:hidden [&>svg:last-child]:hidden"
              }
            />
          ) : null}
        </SidebarFooter>
      </Sidebar>

      <Sidebar
        collapsible="none"
        className={cn(
          "hidden shrink-0",
          !isExpandable &&
            "md:flex md:w-[calc(var(--sidebar-width)-var(--sidebar-width-icon))] group-data-[collapsible=icon]:hidden",
          isExpandable &&
            panelOpen &&
            "md:flex! md:w-[calc(var(--sidebar-width)-var(--sidebar-width-icon))]",
          isExpandable && !panelOpen && "hidden!",
          classNames?.panel,
        )}
      >
        <SidebarHeader className="gap-3.5 p-4">
          {renderPanelHeader && activeItem ? (
            renderPanelHeader(activeItem)
          ) : (
            <div className="flex w-full items-center justify-between">
              <div className="text-sm font-medium text-foreground">
                {activeItem?.title}
              </div>
            </div>
          )}
          {showPanelSearch ? (
            <SidebarInput placeholder={panelSearchPlaceholder} />
          ) : null}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem ? renderPanelContent?.(activeItem) : null}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}

export function AppSidebarDual({
  breadcrumb,
  headerFullBleed = false,
  children,
  verticalSidebarId,
  classNames,
  panelOpen,
  onPanelOpenChange,
  railVariant = "icon-only",
  ...props
}: AppSidebarDualProps) {
  const isExpandable = railVariant === "expandable";
  // Expandable: outer shell stays open; panel visibility is CSS-driven via panelOpen.
  // Icon-only: open maps to showing the second column (legado food/varejo).
  const providerOpen = isExpandable ? true : panelOpen;
  const providerOnOpenChange = isExpandable ? undefined : onPanelOpenChange;
  const defaultOpen = isExpandable ? true : (panelOpen ?? true);

  return (
    <SidebarProvider
      data-vertical-sidebar={verticalSidebarId}
      className={cn("h-svh overflow-hidden", classNames?.provider)}
      defaultOpen={defaultOpen}
      open={providerOpen}
      onOpenChange={providerOnOpenChange}
      style={
        {
          "--sidebar-width":
            isExpandable && panelOpen === false ? "4.5rem" : "21rem",
          "--sidebar-width-icon": "4.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebarDualInner
        {...props}
        railVariant={railVariant}
        panelOpen={panelOpen}
        onPanelOpenChange={onPanelOpenChange}
        classNames={classNames}
      />
      <SidebarInset className="min-w-0">
        <header
          data-slot="vertical-header"
          className={cn(
            "sticky top-0 z-10 flex shrink-0 items-center border-b bg-background",
            headerFullBleed ? "" : "gap-2 p-4",
            classNames?.header,
          )}
        >
          {headerFullBleed ? (
            breadcrumb
          ) : (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 self-center data-vertical:h-4 data-vertical:self-center"
              />
              {breadcrumb ?? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {props.brandSubtitle ?? props.brandName}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </>
          )}
        </header>
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4",
            classNames?.main,
          )}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
