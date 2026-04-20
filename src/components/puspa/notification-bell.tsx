'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CalendarCheck, Heart, UserPlus, Info, Settings, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NotificationBellProps {
  count?: number;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  programme?: { id: string; name: string } | null;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'programme':
      return <CalendarCheck className="h-4 w-4 text-blue-500" />;
    case 'donation':
      return <Heart className="h-4 w-4 text-emerald-500" />;
    case 'member':
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'system':
      return <Settings className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

function getIconBg(type: string) {
  switch (type) {
    case 'programme':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'donation':
      return 'bg-emerald-100 dark:bg-emerald-900/30';
    case 'member':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'system':
      return 'bg-orange-100 dark:bg-orange-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-800';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'programme':
      return 'Program';
    case 'donation':
      return 'Donasi';
    case 'member':
      return 'Ahli';
    case 'system':
      return 'Sistem';
    default:
      return 'Umum';
  }
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Baru sahaja';
  }
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-1 py-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationBell({ count: externalCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(externalCount ?? 5);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activities?limit=10');
      const json = await res.json();
      setActivities(json.data || []);
      if (externalCount === undefined) {
        setUnreadCount(json.data?.length ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  }, [externalCount]);

  useEffect(() => {
    if (open) {
      fetchActivities();
    }
  }, [open, fetchActivities]);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    toast.success('Semua notifikasi telah ditandai sebagai dibaca.');
  };

  const handleViewAll = () => {
    setOpen(false);
    toast.info('Halaman notifikasi penuh akan datang tidak lama lagi.');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                unreadCount > 9
                  ? 'h-4 w-4 text-[9px]'
                  : 'h-4 w-4 text-[10px]'
              )}
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-25" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold">Notifikasi</h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0 h-5"
              >
                {unreadCount} baru
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3 mr-1" />
                Tandai semua dibaca
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Content */}
        {loading ? (
          <NotificationSkeleton />
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Tiada notifikasi</p>
            <p className="text-xs text-muted-foreground/70">
              Semua aktiviti terkini akan muncul di sini.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[340px]">
              <div className="px-2 py-1">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={cn(
                      'group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors cursor-default',
                      'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                        getIconBg(activity.type)
                      )}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatTimeAgo(activity.date)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 py-0 font-normal"
                        >
                          {getTypeLabel(activity.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={handleViewAll}
              >
                Lihat semua notifikasi
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
