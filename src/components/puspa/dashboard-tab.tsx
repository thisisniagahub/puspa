'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CalendarCheck,
  Heart,
  HandHeart,
  TrendingUp,
  Activity,
  Clock,
  MapPin,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Building2,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DonationTrendItem {
  label: string;
  amount: number;
  count: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  metadata: Record<string, unknown> | null;
  programmeId: string | null;
  programme: { id: string; name: string } | null;
}

interface MembersByCategory {
  asnaf: number;
  volunteer: number;
  donor: number;
  staff: number;
}

interface ProgrammesByStatus {
  active: number;
  completed: number;
  upcoming: number;
  cancelled: number;
}

interface StatsData {
  totalMembers: number;
  membersByCategory: MembersByCategory;
  totalProgrammes: number;
  programmesByStatus: ProgrammesByStatus;
  totalDonations: {
    amount: number;
    count: number;
    monthlyBreakdown: DonationTrendItem[];
  };
  totalBeneficiaries: number;
  recentActivities: RecentActivity[];
  donationTrend: DonationTrendItem[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PIE_COLORS: Record<string, string> = {
  asnaf: '#9b59b6',
  volunteer: '#3b82f6',
  donor: '#f59e0b',
  staff: '#8b5cf6',
};

const ACTIVITY_TYPE_STYLES: Record<
  string,
  { className: string; icon: React.ElementType }
> = {
  programme: {
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    icon: CalendarCheck,
  },
  donation: {
    className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    icon: Heart,
  },
  member: {
    className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    icon: Users,
  },
  general: {
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon: Activity,
  },
  system: {
    className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    icon: ArrowUpRight,
  },
};

const QUICK_STATS = [
  {
    label: 'Families Supported',
    value: '5,000+',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  },
  {
    label: 'Years of Service',
    value: '7',
    icon: Award,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  },
  {
    label: 'Community Programmes',
    value: '25+',
    icon: Target,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  },
  {
    label: 'Service Locations',
    value: '15',
    icon: MapPin,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

// ─── Custom Tooltip for Bar Chart ────────────────────────────────────────────

function DonationTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { count: number } }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-purple-600 font-semibold">
        {formatCurrency(payload[0].value)}
      </p>
      {payload[0].payload?.count > 0 && (
        <p className="text-xs text-muted-foreground">
          {payload[0].payload.count} donation(s)
        </p>
      )}
    </div>
  );
}

// ─── Custom Tooltip for Pie Chart ────────────────────────────────────────────

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.fill }}
        />
        <p className="text-sm font-medium capitalize">{item.name}</p>
      </div>
      <p className="text-sm font-semibold ml-[18px]">{item.value} members</p>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  description,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1 sm:space-y-2 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {title}
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {value}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div
              className={cn(
                'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                iconBg
              )}
            >
              <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />
            </div>
          </div>
        </CardContent>
        {/* Decorative gradient line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      </Card>
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Activities skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Custom Legend for Pie Chart ──────────────────────────────────────────────

function CustomPieLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs sm:text-sm capitalize text-muted-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DashboardTab() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          setStats(json.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Loading state ──
  if (loading) return <DashboardSkeleton />;

  // ── Error state ──
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Activity className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state guard ──
  if (!stats) return null;

  // ── Prepare data for pie chart ──
  const pieData = Object.entries(stats.membersByCategory)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: key,
      value: count,
      fill: PIE_COLORS[key] || '#6b7280',
    }));

  // ── Prepare bar chart data (use last 6-12 months) ──
  const barData = stats.donationTrend.slice(-12);

  // ── Prepare recent activities ──
  const recentActivities = stats.recentActivities.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ═══ Stats Cards Row ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Ahli Asnaf"
          value={stats.membersByCategory.asnaf.toLocaleString()}
          icon={Users}
          iconBg="bg-purple-50 dark:bg-purple-950"
          iconColor="text-purple-600"
          description={`${stats.totalMembers} total members`}
          delay={0}
        />
        <StatCard
          title="Active Programmes"
          value={stats.programmesByStatus.active.toString()}
          icon={CalendarCheck}
          iconBg="bg-blue-50 dark:bg-blue-950"
          iconColor="text-blue-600"
          description={`${stats.totalProgrammes} total programmes`}
          delay={0.05}
        />
        <StatCard
          title="Total Donations"
          value={formatCurrency(stats.totalDonations.amount)}
          icon={Heart}
          iconBg="bg-amber-50 dark:bg-amber-950"
          iconColor="text-amber-600"
          description={`${stats.totalDonations.count} donations received`}
          delay={0.1}
        />
        <StatCard
          title="Active Volunteers"
          value={stats.membersByCategory.volunteer.toString()}
          icon={HandHeart}
          iconBg="bg-purple-50 dark:bg-purple-950"
          iconColor="text-purple-600"
          description={`${stats.membersByCategory.donor} donors registered`}
          delay={0.15}
        />
      </div>

      {/* ═══ Charts Section ═══ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Donation Trend Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base sm:text-lg">
                  Donation Trend
                </CardTitle>
              </div>
              <CardDescription>
                Monthly donation amounts (last {barData.length} months)
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) =>
                        value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                      }
                    />
                    <Tooltip content={<DonationTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                    <Bar
                      dataKey="amount"
                      fill="#9b59b6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                  No donation data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Members by Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base sm:text-lg">
                  Members by Category
                </CardTitle>
              </div>
              <CardDescription>
                Breakdown of {stats.totalMembers} total members
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6">
              {pieData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        content={<CustomPieLegend />}
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                  No member data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ Recent Activities ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base sm:text-lg">
                Recent Activities
              </CardTitle>
            </div>
            <CardDescription>
              Latest updates and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.map((activity, index) => {
                  const typeStyle =
                    ACTIVITY_TYPE_STYLES[activity.type] ||
                    ACTIVITY_TYPE_STYLES.general;
                  const TypeIcon = typeStyle.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                      className={cn(
                        'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50',
                        index < recentActivities.length - 1 && 'border-b border-border/50'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          typeStyle.className
                        )}
                      >
                        <TypeIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px] px-1.5 py-0 capitalize',
                              typeStyle.className
                            )}
                          >
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No recent activities
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ Quick Stats Summary ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {QUICK_STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: 0.45 + index * 0.05,
                  ease: 'easeOut',
                }}
              >
                <Card className="group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110',
                        stat.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Beneficiaries Highlight Banner ═══ */}
      {stats.totalBeneficiaries > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 px-5 py-4 sm:px-6 sm:py-5 text-white shadow-lg">
            {/* Decorative background circles */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <p className="text-sm font-medium text-purple-100">
                    Total Beneficiaries Reached
                  </p>
                </div>
                <p className="mt-1 text-2xl sm:text-3xl font-bold">
                  {stats.totalBeneficiaries.toLocaleString()}
                </p>
              </div>
              <div className="text-xs sm:text-sm text-purple-100 text-right">
                Across all programmes
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
