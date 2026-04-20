'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus,
  GripVertical,
  CalendarDays,
  Loader2,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KanbanStatus = 'dirancang' | 'dalam-proses' | 'selesai' | 'dibatalkan';

interface ActivityData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  metadata: Record<string, unknown> | null;
  programmeId: string | null;
  programme: { id: string; name: string } | null;
}

interface ActivityItem extends ActivityData {
  localStatus: KanbanStatus;
}

interface ActivitiesResponse {
  data: ActivityData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ActivitiesKanbanProps {
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KANBAN_COLUMNS: {
  id: KanbanStatus;
  title: string;
  headerColor: string;
  accentBorder: string;
  dotColor: string;
}[] = [
  {
    id: 'dirancang',
    title: 'Dirancang',
    headerColor: 'text-amber-700 dark:text-amber-400',
    accentBorder: 'border-t-amber-500',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'dalam-proses',
    title: 'Dalam Proses',
    headerColor: 'text-blue-700 dark:text-blue-400',
    accentBorder: 'border-t-blue-500',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'selesai',
    title: 'Selesai',
    headerColor: 'text-purple-700 dark:text-purple-400',
    accentBorder: 'border-t-purple-500',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'dibatalkan',
    title: 'Dibatalkan',
    headerColor: 'text-rose-700 dark:text-rose-400',
    accentBorder: 'border-t-rose-500',
    dotColor: 'bg-rose-500',
  },
];

const TYPE_BADGE: Record<
  string,
  { label: string; className: string; borderClass: string }
> = {
  programme: {
    label: 'Program',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    borderClass: 'border-l-blue-500',
  },
  donation: {
    label: 'Sumbangan',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    borderClass: 'border-l-purple-500',
  },
  member: {
    label: 'Ahli',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    borderClass: 'border-l-purple-500',
  },
  general: {
    label: 'Umum',
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    borderClass: 'border-l-gray-500',
  },
  system: {
    label: 'Sistem',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    borderClass: 'border-l-orange-500',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/** Distribute activities across columns via round-robin. */
function assignInitialStatuses(activities: ActivityData[]): ActivityItem[] {
  return activities.map((activity, index) => ({
    ...activity,
    localStatus: KANBAN_COLUMNS[index % KANBAN_COLUMNS.length].id,
  }));
}

// ---------------------------------------------------------------------------
// Draggable Card
// ---------------------------------------------------------------------------

function DraggableCard({
  activity,
  compact,
}: {
  activity: ActivityItem;
  compact?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: activity.id,
    data: { activity },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = TYPE_BADGE[activity.type] || TYPE_BADGE.general;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-background shadow-sm transition-shadow hover:shadow-md border-l-4',
        typeConfig.borderClass,
        isDragging && 'ring-2 ring-primary/30'
      )}
    >
      {/* Drag handle + content */}
      <div className="flex items-start gap-1.5 p-3">
        {/* Handle */}
        <button
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground shrink-0 focus:outline-none active:cursor-grabbing"
          aria-label="Seret kad aktiviti"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium leading-snug truncate">
            {activity.title}
          </p>

          {/* Description (truncated) */}
          {!compact && activity.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {activity.description}
            </p>
          )}

          {/* Footer: type badge + date */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0', typeConfig.className)}
            >
              {typeConfig.label}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3" />
              {formatDate(activity.date)}
            </span>
          </div>

          {/* Programme name (compact mode only shows minimal info) */}
          {!compact && activity.programme && (
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              📌 {activity.programme.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag Overlay Card (shown while dragging)
// ---------------------------------------------------------------------------

function DragOverlayCard({ activity }: { activity: ActivityItem }) {
  const typeConfig = TYPE_BADGE[activity.type] || TYPE_BADGE.general;

  return (
    <div
      className={cn(
        'rounded-lg border border-l-4 bg-background shadow-xl p-3 w-64',
        typeConfig.borderClass
      )}
    >
      <p className="text-sm font-medium truncate">{activity.title}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0', typeConfig.className)}
        >
          {typeConfig.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {formatDate(activity.date)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable Column
// ---------------------------------------------------------------------------

function DroppableColumn({
  column,
  items,
  compact,
  onAddNew,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  items: ActivityItem[];
  compact?: boolean;
  onAddNew: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column: column.id },
  });

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-muted/30 min-w-[260px] sm:min-w-[280px] w-full sm:w-[280px] shrink-0',
        'border-t-4',
        column.accentBorder,
        isOver && 'ring-2 ring-primary/40 bg-muted/60'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', column.dotColor)} />
          <h3 className={cn('text-sm font-semibold', column.headerColor)}>
            {column.title}
          </h3>
          <Badge
            variant="secondary"
            className="h-5 min-w-[20px] px-1.5 text-[11px] font-medium flex items-center justify-center"
          >
            {items.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onAddNew}
          aria-label={`Tambah aktiviti ke ${column.title}`}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Cards list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] max-h-[500px] overflow-y-auto px-3 pb-3',
          isOver && 'bg-primary/5 rounded-lg'
        )}
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
            Tiada aktiviti
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <DraggableCard key={item.id} activity={item} compact={compact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex flex-col rounded-xl border border-t-4 bg-muted/30 min-w-[280px] w-[280px] shrink-0"
          style={{
            borderTopColor: col.dotColor.includes('amber')
              ? '#f59e0b'
              : col.dotColor.includes('blue')
                ? '#3b82f6'
                : col.dotColor.includes('purple')
                  ? '#10b981'
                  : '#f43f5e',
          }}
        >
          <div className="flex items-center gap-2 p-3 pb-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="space-y-2.5 px-3 pb-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ActivitiesKanban({ compact = false }: ActivitiesKanbanProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/activities?limit=100');
      if (!res.ok) throw new Error('Gagal memuat aktiviti');

      const json: ActivitiesResponse = await res.json();
      const items = assignInitialStatuses(json.data || []);
      setActivities(items);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memuat papan aktiviti'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by column
  const columnItems = useMemo(() => {
    const grouped: Record<KanbanStatus, ActivityItem[]> = {
      dirancang: [],
      'dalam-proses': [],
      selesai: [],
      dibatalkan: [],
    };
    for (const activity of activities) {
      grouped[activity.localStatus].push(activity);
    }
    return grouped;
  }, [activities]);

  // Find the activity being dragged (for overlay)
  const activeActivity = useMemo(
    () => activities.find((a) => a.id === activeId) ?? null,
    [activities, activeId]
  );

  // --- Drag handlers ---

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const targetColumnId = over.id as KanbanStatus;
    const validColumnIds = KANBAN_COLUMNS.map((c) => c.id);
    if (!validColumnIds.includes(targetColumnId)) return;

    // Find the dragged activity and its current status
    const draggedItem = activities.find((a) => a.id === active.id);
    if (!draggedItem || draggedItem.localStatus === targetColumnId) return;

    // Update local status
    setActivities((prev) =>
      prev.map((a) =>
        a.id === active.id ? { ...a, localStatus: targetColumnId } : a
      )
    );

    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === targetColumnId);
    toast.success('Status dikemaskini', {
      description: `"${draggedItem.title}" dipindah ke ${targetColumn?.title ?? targetColumnId}.`,
    });
  }

  // Add new activity (placeholder toast)
  function handleAddNew(columnId: KanbanStatus) {
    const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
    toast.info('Ciri tambah aktiviti', {
      description: `Tambah aktiviti baharu ke "${column?.title}" (akan dilaksanakan kemudian).`,
    });
  }

  // Handle refresh
  function handleRefresh() {
    setRefreshing(true);
    fetchActivities();
  }

  // --- Loading state ---

  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="size-4" />
          <span>
            {activities.length} aktiviti tersebar di{' '}
            {KANBAN_COLUMNS.length} lajur
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5 text-xs"
        >
          <RefreshCw
            className={cn('size-3.5', refreshing && 'animate-spin')}
          />
          Muat Semula
        </Button>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              items={columnItems[column.id]}
              compact={compact}
              onAddNew={() => handleAddNew(column.id)}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeActivity ? (
            <DragOverlayCard activity={activeActivity} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
