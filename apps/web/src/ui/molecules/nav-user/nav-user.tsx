"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Avatar } from "../../atoms/avatar";
import { Button } from "../../atoms/button";
import { Divider } from "../../atoms/divider";
import { Menu } from "../../atoms/menu";
import { MenuItem } from "../../atoms/select";
import { Typography } from "../../atoms/typography";

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
      <Avatar
        src={user.avatar}
        alt={user.name}
        sx={(theme) => ({
          width: 32,
          height: 32,
          borderRadius: theme.shape.borderRadius,
          fontSize: "0.75rem",
        })}
      >
        {initials}
      </Avatar>
      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          display: compact ? { xs: "none", md: "grid" } : "grid",
          textAlign: "left",
          lineHeight: 1.25,
        }}
      >
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
          {user.name}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
          {user.email}
        </Typography>
      </Box>
    </>
  );
}

function NavUserMenuItems({
  menuGroups,
  linkComponent: LinkComponent = DefaultNavUserLink,
  onClose,
}: {
  menuGroups: NavUserMenuGroup[];
  linkComponent?: NavUserLinkComponent;
  onClose: () => void;
}) {
  if (menuGroups.length === 0) return null;

  return menuGroups.map((group, groupIndex) => (
    <React.Fragment key={groupIndex}>
      <Divider />
      {group.items.map((item) => {
        const ItemIcon = item.icon;

        if (item.href) {
          return (
            <MenuItem key={item.label} onClick={onClose} sx={{ p: 0 }}>
              <Box
                component={LinkComponent}
                href={item.href}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                  px: 2,
                  py: 1,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {ItemIcon ? (
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <ItemIcon />
                  </ListItemIcon>
                ) : null}
                <ListItemText>{item.label}</ListItemText>
              </Box>
            </MenuItem>
          );
        }

        return (
          <MenuItem
            key={item.label}
            onClick={() => {
              onClose();
              item.onSelect?.();
            }}
            sx={{ gap: 1 }}
          >
            {ItemIcon ? (
              <ListItemIcon sx={{ minWidth: 28 }}>
                <ItemIcon />
              </ListItemIcon>
            ) : null}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        );
      })}
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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  const anchorOrigin = (() => {
    switch (dropdownSide) {
      case "top":
        return { vertical: "top" as const, horizontal: dropdownAlign === "start" ? "left" as const : dropdownAlign === "center" ? "center" as const : "right" as const };
      case "left":
        return { vertical: "center" as const, horizontal: "left" as const };
      case "right":
        return { vertical: "center" as const, horizontal: "right" as const };
      default:
        return {
          vertical: "bottom" as const,
          horizontal:
            dropdownAlign === "start"
              ? "left" as const
              : dropdownAlign === "center"
                ? "center" as const
                : "right" as const,
        };
    }
  })();

  const transformOrigin = (() => {
    switch (dropdownSide) {
      case "top":
        return { vertical: "bottom" as const, horizontal: anchorOrigin.horizontal };
      case "left":
        return { vertical: "center" as const, horizontal: "right" as const };
      case "right":
        return { vertical: "center" as const, horizontal: "left" as const };
      default:
        return { vertical: "top" as const, horizontal: anchorOrigin.horizontal };
    }
  })();

  return (
    <>
      <Box
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ display: "inline-flex" }}
      >
        {trigger}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: {
            className: contentClassName,
            sx: { minWidth: 224 },
          },
        }}
      >
        <Box sx={{ px: 1, py: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 1,
            }}
          >
            <UserIdentity user={user} />
          </Box>
        </Box>
        <NavUserMenuItems
          menuGroups={menuGroups}
          linkComponent={linkComponent}
          onClose={handleClose}
        />
      </Menu>
    </>
  );
}

function NavUserHeader({
  buttonClassName,
  dropdownSide = "bottom",
  dropdownAlign = "end",
  ...props
}: NavUserProps) {
  const trigger = (
    <Button
      type="button"
      variant="text"
      className={buttonClassName}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.75,
        minWidth: 0,
        textAlign: "left",
      }}
    >
      <UserIdentity user={props.user} compact />
      <UnfoldMoreIcon
        sx={{ fontSize: 16, flexShrink: 0, color: "text.secondary" }}
      />
    </Button>
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

function NavUserSidebar({
  buttonClassName,
  dropdownSide,
  dropdownAlign,
  ...props
}: NavUserProps) {
  const trigger = (
    <Button
      type="button"
      variant="text"
      className={buttonClassName}
      fullWidth
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        justifyContent: "flex-start",
        minWidth: 0,
        px: 1,
        py: 0.75,
      }}
    >
      <UserIdentity user={props.user} />
      <UnfoldMoreIcon
        sx={{ fontSize: 16, ml: "auto", flexShrink: 0, color: "text.secondary" }}
      />
    </Button>
  );

  return (
    <NavUserDropdown
      {...props}
      trigger={trigger}
      dropdownSide={dropdownSide ?? "right"}
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
