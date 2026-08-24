'use client';

import { LogOut } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@citybox/ui/atoms';

type AdminSidebarFooterProps = {
  onLogout: () => void;
};

export function AdminSidebarFooter({ onLogout }: AdminSidebarFooterProps) {
  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          tooltip="Sair"
          onClick={onLogout}
          className="group-data-[collapsible=icon]:justify-center"
        >
          <LogOut />
          <span>Sair</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
