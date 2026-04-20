'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Heart,
  Building2,
  MessageCircle,
  Menu,
  X,
  Moon,
  Sun,
  Flower2,
  FileText,
  Search,
  Kanban,
  Bell,
  Wrench,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import DashboardTab from '@/components/puspa/dashboard-tab';
import MembersTab from '@/components/puspa/members-tab';
import ProgrammesTab from '@/components/puspa/programmes-tab';
import DonationsTab from '@/components/puspa/donations-tab';
import AdminTab from '@/components/puspa/admin-tab';
import ChatTab from '@/components/puspa/chat-tab';
import AIReportTab from '@/components/puspa/ai-report-tab';
import ActivitiesKanban from '@/components/puspa/activities-kanban';
import CommandPalette from '@/components/puspa/command-palette';
import NotificationBell from '@/components/puspa/notification-bell';
import MemberToolsTab from '@/components/puspa/member-tools-tab';

const tabs = [
  { id: 'dashboard', label: 'Utama', icon: LayoutDashboard },
  { id: 'members', label: 'Ahli', icon: Users },
  { id: 'programmes', label: 'Program', icon: CalendarDays },
  { id: 'donations', label: 'Donasi', icon: Heart },
  { id: 'activities', label: 'Aktiviti', icon: Kanban },
  { id: 'member-tools', label: 'Alat Ahli', icon: Wrench },
  { id: 'admin', label: 'Pentadbiran', icon: Building2 },
  { id: 'chat', label: 'AI Chat', icon: MessageCircle },
  { id: 'report', label: 'Laporan AI', icon: FileText },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommandNavigate = useCallback((tab: string, _itemId?: string) => {
    handleTabChange(tab as TabId);
    setCommandOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-purple-100 dark:border-purple-900/30',
          scrolled && 'shadow-lg shadow-purple-100/20 dark:shadow-black/20'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900/30 overflow-hidden">
                <Image
                  src="/puspa-logo-official.png"
                  alt="PUSPA Logo"
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-purple-500 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent leading-tight">
                  PUSPA
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  Pertubuhan Urus Peduli Asnaf
                </span>
              </div>
              <Badge variant="secondary" className="hidden md:flex bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs ml-1">
                <Flower2 className="w-3 h-3 mr-1" />
                Sejak 2018
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                      isActive
                        ? 'text-purple-700 dark:text-purple-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-purple-100 dark:bg-purple-900/30 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground h-8 px-3 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-900/20"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari...</span>
                <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border border-muted-foreground/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">&#8984;</span>K
                </kbd>
              </Button>

              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-purple-100 dark:border-purple-900/30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl"
            >
              <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-4 gap-1.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-all',
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={handleCommandNavigate}
      />

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'members' && <MembersTab />}
              {activeTab === 'programmes' && <ProgrammesTab />}
              {activeTab === 'donations' && <DonationsTab />}
              {activeTab === 'activities' && <ActivitiesKanban />}
              {activeTab === 'member-tools' && <MemberToolsTab />}
              {activeTab === 'admin' && <AdminTab />}
              {activeTab === 'chat' && <ChatTab />}
              {activeTab === 'report' && <AIReportTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-100 dark:border-purple-900/30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 overflow-hidden">
                <Image
                  src="/puspa-logo-official.png"
                  alt="PUSPA"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  PUSPA
                </p>
                <p className="text-xs text-muted-foreground">
                  Transforming Lives Through Compassionate Aid
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>2253, Jalan Permata 22, Taman Permata, 53300 Gombak</span>
              <span className="hidden sm:inline">|</span>
              <span>salam.puspaKL@gmail.com</span>
              <span className="hidden sm:inline">|</span>
              <span>+6012-3183369</span>
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} PUSPA. Hak cipta terpelihara.</p>
              <p className="text-[10px]">
                Dibangunkan dengan Next.js &amp; AI
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
