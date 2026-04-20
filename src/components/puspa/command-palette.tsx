'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  CalendarDays,
  Heart,
  LayoutDashboard,
  Building2,
  MessageCircle,
  Search,
  Loader2,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

interface MemberItem {
  id: string;
  name: string;
  icNumber: string;
  category: string;
  status: string;
}

interface ProgrammeItem {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface DonationItem {
  id: string;
  donorName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  date: string;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Utama', icon: LayoutDashboard },
  { id: 'members', label: 'Ahli', icon: Users },
  { id: 'programmes', label: 'Program', icon: CalendarDays },
  { id: 'donations', label: 'Donasi', icon: Heart },
  { id: 'admin', label: 'Pentadbiran', icon: Building2 },
  { id: 'chat', label: 'AI Chat', icon: MessageCircle },
];

function LoadingSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CommandPaletteInner({
  open,
  onOpenChange,
  onNavigate,
}: CommandPaletteProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, programmesRes, donationsRes, activitiesRes] =
        await Promise.all([
          fetch('/api/members?limit=20').then((r) => r.json()),
          fetch('/api/programmes?limit=20').then((r) => r.json()),
          fetch('/api/donations?limit=10').then((r) => r.json()),
          fetch('/api/activities?limit=10').then((r) => r.json()),
        ]);

      setMembers(membersRes.data || []);
      setProgrammes(programmesRes.programmes || programmesRes.data || []);
      setDonations(donationsRes.donations || donationsRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch command palette data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  // Global keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (tab: string, itemId?: string) => {
    onOpenChange(false);
    onNavigate(tab, itemId);
  };

  const hasResults = members.length > 0 || programmes.length > 0 || donations.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <CommandInput
        placeholder="Cari ahli, program, donasi..."
      />
      <CommandList>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Tiada hasil ditemui.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Cuba kata kunci yang berbeza.
                </p>
              </div>
            </CommandEmpty>

            {/* Navigation Group */}
            <CommandGroup heading="Navigasi" className="text-gray-500">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`nav-${item.id}-${item.label}`}
                    onSelect={() => handleSelect(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{item.label}</span>
                    <CommandShortcut className="text-[10px]">
                      Tab
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Members Group */}
            {members.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Ahli">
                  {members.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`member-${member.name}-${member.icNumber}`}
                      onSelect={() => handleSelect('members', member.id)}
                    >
                      <Users className="mr-2 h-4 w-4 text-purple-500" />
                      <span className="flex-1 truncate">{member.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {member.category === 'asnaf' ? 'Asnaf' : 'Pemohon'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Programmes Group */}
            {programmes.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Program">
                  {programmes.map((programme) => (
                    <CommandItem
                      key={programme.id}
                      value={`programme-${programme.name}-${programme.category}`}
                      onSelect={() => handleSelect('programmes', programme.id)}
                    >
                      <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="flex-1 truncate">{programme.name}</span>
                      <span
                        className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          programme.status === 'active'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : programme.status === 'completed'
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {programme.status === 'active'
                          ? 'Aktif'
                          : programme.status === 'completed'
                            ? 'Selesai'
                            : 'Dirancang'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Donations Group */}
            {donations.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Donasi">
                  {donations.map((donation) => (
                    <CommandItem
                      key={donation.id}
                      value={`donation-${donation.donorName}-${donation.amount}`}
                      onSelect={() => handleSelect('donations', donation.id)}
                    >
                      <Heart className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="flex-1 truncate">{donation.donorName}</span>
                      <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(donation.amount)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Activities Group */}
            {activities.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Aktiviti Terkini">
                  {activities.map((activity) => (
                    <CommandItem
                      key={activity.id}
                      value={`activity-${activity.title}-${activity.type}`}
                      onSelect={() => handleSelect('dashboard')}
                    >
                      <div className="mr-2 h-4 w-4 flex items-center justify-center">
                        {activity.type === 'programme' ? (
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                        ) : activity.type === 'donation' ? (
                          <Heart className="h-4 w-4 text-purple-500" />
                        ) : activity.type === 'member' ? (
                          <Users className="h-4 w-4 text-purple-500" />
                        ) : (
                          <LayoutDashboard className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span className="flex-1 truncate">{activity.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}

        {/* Footer hint */}
        {!loading && hasResults && (
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↑↓
              </kbd>
              Navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↵
              </kbd>
              Pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                esc
              </kbd>
              Tutup
            </span>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// ---------------------------------------------------------------------------
// Standalone named export with self-managed state (for layout use)
// ---------------------------------------------------------------------------
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const handleNavigate = useCallback((_tab: string, _itemId?: string) => {
    setOpen(false);
  }, []);

  const memoizedOnOpenChange = useMemo(() => setOpen, []);
  const memoizedOnNavigate = useMemo(() => handleNavigate, [handleNavigate]);

  return (
    <CommandPaletteInner
      open={open}
      onOpenChange={memoizedOnOpenChange}
      onNavigate={memoizedOnNavigate}
    />
  );
}
