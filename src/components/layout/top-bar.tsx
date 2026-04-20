"use client";

import { useTheme } from "next-themes";
import { Search, Moon, Sun, Bell, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NotificationBell from "@/components/puspa/notification-bell";
import { useState } from "react";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb placeholder */}
      <div className="flex-1">
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          PUSPA — Sistem Pengurusan NGO
        </h2>
      </div>

      {/* Search trigger (Ctrl+K) */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex items-center gap-2 h-8 px-3 text-muted-foreground text-xs font-normal"
              onClick={() => {
                // Dispatch keyboard event to trigger command palette
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari…</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Cari (⌘K)</TooltipContent>
        </Tooltip>

        {/* Mobile search trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Cari</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notification Bell */}
      <NotificationBell />

      {/* Theme Toggle */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Tukar tema</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {theme === "dark" ? "Mod Cahaya" : "Mod Gelap"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
}
