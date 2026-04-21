"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Heart,
  FolderKanban,
  Calendar,
  Wallet,
  Wand2,
  MessageCircle,
  Wrench,
  Settings,
  ChevronDown,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Pengurusan Kes", href: "/cases", icon: FileText, badge: "Baru", badgeColor: "bg-red-500" },
      { title: "Ahli", href: "/members", icon: Users },
      { title: "Program", href: "/programmes", icon: FolderKanban },
    ],
  },
  {
    label: "Kewangan",
    items: [
      { title: "Sumbangan", href: "/donations", icon: Heart },
      { title: "Pengagihan", href: "/disbursements", icon: Wallet },
    ],
  },
  {
    label: "Operasi",
    items: [
      { title: "Memos", href: "/captures", icon: Inbox, badge: "New", badgeColor: "bg-purple-600" },
      { title: "Aktiviti", href: "/activities", icon: Calendar },
    ],
  },
  {
    label: "Alat",
    items: [
      { title: "AI Report", href: "/ai-report", icon: Wand2 },
      { title: "Chat AI", href: "/chat", icon: MessageCircle },
      { title: "Alat Ahli", href: "/member-tools", icon: Wrench },
      { title: "Pentadbiran", href: "/admin", icon: Settings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold text-sm">
                  P
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PUSPA</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Sistem Pengurusan
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white",
                              item.badgeColor ?? "bg-primary"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar ?? "/puspa-logo-official.png"} alt={user?.name ?? "Pengguna"} />
                    <AvatarFallback className="rounded-lg">{user?.name?.charAt(0) ?? "P"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name ?? "PUSPA User"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? "Tiada emel"}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Tetapan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={logout}>
                  Log Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
