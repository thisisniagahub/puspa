'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useTheme } from 'next-themes';

import DashboardTab from '@/components/puspa/dashboard-tab';
import MembersTab from '@/components/puspa/members-tab';
import ProgrammesTab from '@/components/puspa/programmes-tab';
import DonationsTab from '@/components/puspa/donations-tab';
import AdminTab from '@/components/puspa/admin-tab';
import ChatTab from '@/components/puspa/chat-tab';

const tabs = [
  { id: 'dashboard', label: 'Utama', icon: LayoutDashboard },
  { id: 'members', label: 'Ahli', icon: Users },
  { id: 'programmes', label: 'Program', icon: CalendarDays },
  { id: 'donations', label: 'Donasi', icon: Heart },
  { id: 'admin', label: 'Pentadbiran', icon: Building2 },
  { id: 'chat', label: 'AI Chat', icon: MessageCircle },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid calling setState directly in effect body
  if (typeof window !== 'undefined' && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-emerald-100 dark:border-emerald-900/30',
          scrolled && 'shadow-lg shadow-emerald-100/20 dark:shadow-black/20'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 overflow-hidden">
                <Image
                  src="/puspa-logo.png"
                  alt="PUSPA Logo"
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent leading-tight">
                  PUSPA
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  Pertubuhan Urus Peduli Asnaf
                </span>
              </div>
              <Badge variant="secondary" className="hidden md:flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs ml-1">
                <Flower2 className="w-3 h-3 mr-1" />
                Sejak 2018
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
              className="lg:hidden overflow-hidden border-t border-emerald-100 dark:border-emerald-900/30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl"
            >
              <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all',
                        isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
              {activeTab === 'admin' && <AdminTab />}
              {activeTab === 'chat' && <ChatTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-100 dark:border-emerald-900/30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 overflow-hidden">
                <Image
                  src="/puspa-logo.png"
                  alt="PUSPA"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  PUSPA
                </p>
                <p className="text-xs text-muted-foreground">
                  Pertubuhan Urus Peduli Asnaf KL & Selangor
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
