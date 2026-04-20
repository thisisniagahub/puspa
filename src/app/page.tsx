'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useOpenClawStore, type NavigationTab } from '@/store/openclaw-store';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

// Lucide icons
import {
  LayoutDashboard,
  Server,
  PackageOpen,
  Link2,
  TerminalSquare,
  Bot,
  Cpu,
  Zap,
  Search,
  Bell,
  Menu,
  Moon,
  Sun,
  Activity,
  Wifi,
  WifiOff,
  ChevronRight,
  Settings,
} from 'lucide-react';

// Section components
import { DashboardContent } from '@/components/openclaw/dashboard-content';
import { MCPServersContent } from '@/components/openclaw/mcp-servers-content';
import { PluginsContent } from '@/components/openclaw/plugins-content';
import { IntegrationsContent } from '@/components/openclaw/integrations-content';
import { TerminalContent } from '@/components/openclaw/terminal-content';
import { AgentsContent } from '@/components/openclaw/agents-content';
import { ModelsContent } from '@/components/openclaw/models-content';
import { AutomationContent } from '@/components/openclaw/automation-content';

// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mcp-servers', label: 'MCP Servers', icon: Server },
  { id: 'plugins', label: 'Plugins', icon: PackageOpen },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'terminal', label: 'Terminal', icon: TerminalSquare },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'automation', label: 'Automation', icon: Zap },
];

const TAB_TITLES: Record<NavigationTab, string> = {
  dashboard: 'Dashboard',
  'mcp-servers': 'MCP Servers',
  plugins: 'Plugins',
  integrations: 'Integrations',
  terminal: 'Terminal',
  agents: 'Agents',
  models: 'Models',
  automation: 'Automation',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${rh}h`;
  }
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex w-[280px] flex-col border-r border-border">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="flex-1 p-3 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-3">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </aside>
      {/* Main skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 px-6 h-16 border-b border-border">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-9 w-64 rounded-lg ml-auto" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content (shared between desktop and mobile sheet)
// ---------------------------------------------------------------------------

function SidebarNav({
  activeTab,
  onTabChange,
  collapsed = false,
}: {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  collapsed?: boolean;
}) {
  const { system, setActiveTab } = useOpenClawStore();
  const { theme, setTheme } = useTheme();

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary text-xl">
          <span role="img" aria-label="OpenClaw logo">
            🦞
          </span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              OpenClaw
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              AI Agent Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <TooltipProvider key={item.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && isActive && (
                      <ChevronRight className="ml-auto w-4 h-4 text-primary" />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 w-1 h-8 rounded-r-full bg-primary"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* Gateway status */}
        <div className="flex items-center gap-2.5 px-2">
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full shrink-0',
              system.gatewayStatus === 'online'
                ? 'bg-green-500 pulse-dot'
                : system.gatewayStatus === 'degraded'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {system.gatewayStatus === 'online'
              ? 'Gateway Online'
              : system.gatewayStatus === 'degraded'
                ? 'Gateway Degraded'
                : system.gatewayStatus === 'starting'
                  ? 'Gateway Starting…'
                  : 'Gateway Offline'}
          </span>
        </div>

        {/* Theme toggle */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  'w-full justify-start gap-2 text-muted-foreground hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 shrink-0" />
                )}
                {!collapsed && <span className="text-xs">Toggle Theme</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Settings placeholder */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start gap-2 text-muted-foreground hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-xs">Settings</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Settings</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System status pill (shown in header)
// ---------------------------------------------------------------------------

function SystemStatusPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden xl:inline">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Hydration guard
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = useOpenClawStore((s) => s.activeTab);
  const system = useOpenClawStore((s) => s.system);
  const setActiveTab = useOpenClawStore((s) => s.setActiveTab);

  const unreadCount = system.notifications.filter((n) => !n.read).length;

  // Don't render interactive UI on the server to avoid hydration mismatches
  if (!isClient) {
    return <LoadingSkeleton />;
  }

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ================================================================= */}
      {/* Desktop Sidebar                                                     */}
      {/* ================================================================= */}
      <aside className="sidebar-gradient hidden md:flex md:w-[280px] md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 border-r border-border/50">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      {/* ================================================================= */}
      {/* Mobile Sidebar (Sheet drawer)                                      */}
      {/* ================================================================= */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 sidebar-gradient border-r border-border/50">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>OpenClaw navigation menu</SheetDescription>
          </SheetHeader>
          <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        </SheetContent>
      </Sheet>

      {/* ================================================================= */}
      {/* Main content area                                                  */}
      {/* ================================================================= */}
      <div className="flex-1 md:pl-[280px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 sidebar-gradient border-r border-border/50">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>OpenClaw navigation menu</SheetDescription>
              </SheetHeader>
              <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
            </SheetContent>
          </Sheet>

          {/* Page title */}
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {TAB_TITLES[activeTab]}
          </h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/60 w-64 lg:w-80 text-muted-foreground text-sm">
            <Search className="w-4 h-4 shrink-0" />
            <span className="text-xs">Search agents, servers, plugins…</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>

          {/* System status indicators */}
          <SystemStatusPill
            label="Uptime"
            value={formatUptime(system.uptime)}
            icon={Activity}
          />
          <SystemStatusPill
            label="Memory"
            value={`${system.memoryUsage}%`}
            icon={Cpu}
          />
          <SystemStatusPill
            label="Connections"
            value={String(system.activeConnections)}
            icon={system.gatewayStatus === 'online' ? Wifi : WifiOff}
          />

          {/* Notification bell */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative shrink-0">
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                  <span className="sr-only">
                    Notifications ({unreadCount} unread)
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'No new notifications'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {activeTab === 'dashboard' && <DashboardContent />}
                {activeTab === 'mcp-servers' && <MCPServersContent />}
                {activeTab === 'plugins' && <PluginsContent />}
                {activeTab === 'integrations' && <IntegrationsContent />}
                {activeTab === 'terminal' && <TerminalContent />}
                {activeTab === 'agents' && <AgentsContent />}
                {activeTab === 'models' && <ModelsContent />}
                {activeTab === 'automation' && <AutomationContent />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
