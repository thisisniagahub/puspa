'use client';

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useOpenClawStore } from '@/store/openclaw-store';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

// PUSPA components (default exports)
import DashboardTab from '@/components/puspa/dashboard-tab';
import MembersTab from '@/components/puspa/members-tab';
import ProgrammesTab from '@/components/puspa/programmes-tab';
import DonationsTab from '@/components/puspa/donations-tab';
import ActivitiesKanban from '@/components/puspa/activities-kanban';
import AIReportTab from '@/components/puspa/ai-report-tab';
import ChatTab from '@/components/puspa/chat-tab';
import AdminTab from '@/components/puspa/admin-tab';
import MemberToolsTab from '@/components/puspa/member-tools-tab';
import NotificationBell from '@/components/puspa/notification-bell';
import CommandPalette from '@/components/puspa/command-palette';

// OpenClaw components (named exports)
import { MCPServersContent } from '@/components/openclaw/mcp-servers-content';
import { PluginsContent } from '@/components/openclaw/plugins-content';
import { IntegrationsContent } from '@/components/openclaw/integrations-content';
import { TerminalContent } from '@/components/openclaw/terminal-content';
import { AgentsContent } from '@/components/openclaw/agents-content';
import { ModelsContent } from '@/components/openclaw/models-content';
import { AutomationContent } from '@/components/openclaw/automation-content';

// Lucide icons
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Heart,
  Calendar,
  Wand2,
  MessageCircle,
  Wrench,
  Settings,
  Server,
  Puzzle,
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
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tab type & navigation config
// ---------------------------------------------------------------------------

type TabId =
  // PUSPA
  | 'dashboard'
  | 'members'
  | 'programmes'
  | 'donations'
  | 'activities'
  | 'ai-report'
  | 'chat'
  | 'member-tools'
  | 'admin'
  // OpenClaw
  | 'mcp-servers'
  | 'plugins'
  | 'integrations'
  | 'terminal'
  | 'agents'
  | 'models'
  | 'automation';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;
  group: 'puspa' | 'openclaw';
}

const PUSPA_TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'puspa' },
  { id: 'members', label: 'Ahli', icon: Users, group: 'puspa' },
  { id: 'programmes', label: 'Program', icon: FolderKanban, group: 'puspa' },
  { id: 'donations', label: 'Donasi', icon: Heart, group: 'puspa' },
  { id: 'activities', label: 'Aktiviti', icon: Calendar, group: 'puspa' },
  { id: 'ai-report', label: 'Alat AI', icon: Wand2, group: 'puspa' },
  { id: 'chat', label: 'Chat AI', icon: MessageCircle, group: 'puspa' },
  { id: 'member-tools', label: 'Alat Ahli', icon: Wrench, group: 'puspa' },
  { id: 'admin', label: 'Admin', icon: Settings, group: 'puspa' },
];

const OPENCLAW_TABS: TabDef[] = [
  { id: 'mcp-servers', label: 'MCP Servers', icon: Server, group: 'openclaw' },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, group: 'openclaw' },
  { id: 'integrations', label: 'Integrations', icon: Link2, group: 'openclaw' },
  { id: 'terminal', label: 'Terminal', icon: TerminalSquare, group: 'openclaw' },
  { id: 'agents', label: 'Agents', icon: Bot, group: 'openclaw' },
  { id: 'models', label: 'Models', icon: Cpu, group: 'openclaw' },
  { id: 'automation', label: 'Automation', icon: Zap, group: 'openclaw' },
];

const ALL_TABS: TabDef[] = [...PUSPA_TABS, ...OPENCLAW_TABS];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar skeleton */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex items-center gap-1 px-4 h-12 border-b border-border overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content renderer
// ---------------------------------------------------------------------------

function TabContent({ tabId }: { tabId: TabId }) {
  switch (tabId) {
    case 'dashboard':
      return <DashboardTab />;
    case 'members':
      return <MembersTab />;
    case 'programmes':
      return <ProgrammesTab />;
    case 'donations':
      return <DonationsTab />;
    case 'activities':
      return <ActivitiesKanban />;
    case 'ai-report':
      return <AIReportTab />;
    case 'chat':
      return <ChatTab />;
    case 'member-tools':
      return <MemberToolsTab />;
    case 'admin':
      return <AdminTab />;
    case 'mcp-servers':
      return <MCPServersContent />;
    case 'plugins':
      return <PluginsContent />;
    case 'integrations':
      return <IntegrationsContent />;
    case 'terminal':
      return <TerminalContent />;
    case 'agents':
      return <AgentsContent />;
    case 'models':
      return <ModelsContent />;
    case 'automation':
      return <AutomationContent />;
    default:
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Unknown tab
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Single tab button
// ---------------------------------------------------------------------------

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: TabDef;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  const isPuspa = tab.group === 'puspa';

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0',
              isPuspa && isActive && 'bg-primary/10 text-primary',
              isPuspa && !isActive && 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              !isPuspa && isActive && 'bg-[oklch(0.55_0.22_25/0.1)] text-[oklch(0.55_0.22_25)] dark:bg-[oklch(0.7_0.18_25/0.15)] dark:text-[oklch(0.75_0.18_25)]',
              !isPuspa && !isActive && 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-medium">
          {tab.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Hydration guard
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Local tab state
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Command palette state
  const [commandOpen, setCommandOpen] = useState(false);

  // OpenClaw store (only for gateway status & system notifications)
  const gatewayStatus = useOpenClawStore((s) => s.system.gatewayStatus);

  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to open command palette
  useEffect(() => {
    if (!isClient) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isClient]);

  // Command palette navigation callback
  const handleCommandNavigate = useCallback((tab: string, _itemId?: string) => {
    setActiveTab(tab as TabId);
  }, []);

  // Don't render interactive UI on the server
  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* ================================================================= */}
        {/* Top Navbar (sticky, h-16)                                         */}
        {/* ================================================================= */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          {/* PUSPA Logo */}
          <img
            src="/puspa-logo-official.png"
            alt="PUSPA"
            className="h-9 w-9 rounded-lg object-contain shrink-0"
          />

          {/* App Name */}
          <span className="text-lg font-bold tracking-tight text-foreground shrink-0">
            PUSPA
          </span>

          {/* Search trigger (open command palette) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex items-center gap-2 h-8 px-3 text-muted-foreground text-xs font-normal ml-2"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari…</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* OpenClaw Gateway Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/50">
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full shrink-0',
                gatewayStatus === 'online'
                  ? 'bg-green-500 animate-pulse'
                  : gatewayStatus === 'degraded'
                    ? 'bg-yellow-500'
                    : gatewayStatus === 'starting'
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-red-500'
              )}
            />
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
              {gatewayStatus === 'online'
                ? 'Gateway Online'
                : gatewayStatus === 'degraded'
                  ? 'Gateway Degraded'
                  : gatewayStatus === 'starting'
                    ? 'Starting…'
                    : 'Offline'}
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                  {!mounted && <Skeleton className="h-4 w-4 rounded" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Toggle theme'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Mobile menu (search trigger on mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden shrink-0"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
        </header>

        {/* ================================================================= */}
        {/* Horizontal Tabs Bar (sticky below navbar)                         */}
        {/* ================================================================= */}
        <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto tabs-scrollbar">
            {/* PUSPA Tabs */}
            {PUSPA_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}

            {/* Separator badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 mx-1.5 shrink-0">
              <span className="text-sm leading-none" role="img" aria-label="OpenClaw">
                🦞
              </span>
              <span className="text-[11px] font-semibold text-[oklch(0.55_0.22_25)] dark:text-[oklch(0.75_0.18_25)] hidden sm:inline">
                OpenClaw
              </span>
            </div>

            {/* OpenClaw Tabs */}
            {OPENCLAW_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* Content Area                                                      */}
        {/* ================================================================= */}
        <main className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <TabContent tabId={activeTab} />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ================================================================= */}
        {/* Command Palette                                                   */}
        {/* ================================================================= */}
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onNavigate={handleCommandNavigate}
        />
      </div>
    </TooltipProvider>
  );
}
