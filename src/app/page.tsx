'use client';

import { useSyncExternalStore, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/components/auth/login-page";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function HomePage() {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { user, isLoading } = useAuth();

  if (!isClient || isLoading) {
    return <DashboardSkeleton />;
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Redirect to dashboard (handled by the (dashboard) layout)
  // Since this IS the dashboard page, show it inline
  return <DashboardContent />;
}

// ============================================================
// Dashboard Content — shown when user is authenticated
// ============================================================

import { motion } from "framer-motion";
import {
  FileText, Users, Heart, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Activity, Clock, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, PriorityBadge } from "@/components/shared/badges";
import { cn } from "@/lib/utils";

interface DashboardStats {
  cases: { total: number; pending: number; active: number; closed: number; urgent: number; rejected: number; pipeline: Record<string, number> };
  donations: { totalAmount: number; totalDonors: number; thisMonth: number };
  programmes: { active: number; total: number };
  disbursements: { totalAmount: number; totalTransactions: number; balance: number };
  recentCases: { id: string; caseNumber: string; applicantName: string; status: string; priority: string; assignee: string | null; createdAt: string }[];
  recentDonations: { id: string; donorName: string; amount: number; status: string; method: string; date: string }[];
}

const PRIORITY_STYLES: Record<string, { label: string; color: string }> = {
  urgent: { label: "Mendesak", color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  high: { label: "Tinggi", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  normal: { label: "Normal", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  low: { label: "Rendah", color: "text-gray-600 bg-gray-50 dark:bg-gray-950/30" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 0 }).format(amount);
}

function StatCard({ title, value, icon: Icon, description, trend, color = "text-primary" }: {
  title: string; value: string | number; icon: React.ComponentType<{ className?: string }>;
  description?: string; trend?: "up" | "down"; color?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl md:text-3xl font-bold tracking-tight", color)}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                {description}
              </p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5 bg-primary/10", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function fetchStats() {
      try {
        const res = await fetch("/api/v1/stats");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) {
          setStats(json.data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 p-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-semibold">Gagal memuatkan dashboard</p>
        <p className="text-sm text-muted-foreground mb-4">Sila cuba lagi</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Cuba Lagi</Button>
      </div>
    );
  }

  const pendingCases = stats.cases.pending + stats.cases.urgent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {user?.name} — Overview operasi PUSPA</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { title: "Kes Aktif", value: stats.cases.total, icon: FileText, description: `${pendingCases} menunggu tindakan`, color: "text-purple-600 dark:text-purple-400" },
          { title: "Total Sumbangan", value: formatCurrency(stats.donations.totalAmount), icon: Heart, description: `Bulan ini: ${formatCurrency(stats.donations.thisMonth)}`, trend: stats.donations.thisMonth > 0 ? "up" : undefined, color: "text-green-600 dark:text-green-400" },
          { title: "Baki Tersedia", value: formatCurrency(stats.disbursements.balance), icon: Wallet, description: `${stats.disbursements.totalTransactions} transaksi diagihkan`, color: "text-amber-600 dark:text-amber-400" },
          { title: "Program Aktif", value: stats.programmes.active, icon: Activity, description: `daripada ${stats.programmes.total} program`, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Urgent Cases Alert */}
      {stats.cases.urgent > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.3 }}>
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl p-2 bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-300">{stats.cases.urgent} Kes Mendesak</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Memerlukan tindakan segera</p>
              </div>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30">
                Lihat <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Kes Terkini</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Semua <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentCases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tiada kes untuk dipaparkan</p>
                </div>
              )}
              {stats.recentCases.map((c) => {
                const priorityStyle = PRIORITY_STYLES[c.priority] ?? PRIORITY_STYLES.normal;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{c.caseNumber}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", priorityStyle.color)}>{priorityStyle.label}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{c.applicantName}</p>
                      {c.assignee && <p className="text-xs text-muted-foreground">→ {c.assignee}</p>}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Donations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sumbangan Terkini</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Semua <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentDonations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tiada sumbangan untuk dipaparkan</p>
                </div>
              )}
              {stats.recentDonations.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="rounded-xl p-2 bg-green-100 dark:bg-green-900/30">
                    <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.donorName}</p>
                    <p className="text-xs text-muted-foreground">{d.method} · {new Date(d.date).toLocaleDateString("ms-MY")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(d.amount)}</p>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Case Status Pipeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pipeline Kes</CardTitle>
            <CardDescription>Senasa kes berdasarkan status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { label: "Draf", count: stats.cases.pipeline?.draft ?? 0, color: "bg-gray-400" },
                { label: "Menunggu", count: stats.cases.pending, color: "bg-blue-500" },
                { label: "Aktif", count: stats.cases.active, color: "bg-purple-500" },
                { label: "Siap", count: stats.cases.closed, color: "bg-green-500" },
                { label: "Ditolak", count: stats.cases.rejected, color: "bg-red-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                    <span className="text-xs font-bold">{item.count}</span>
                  </div>
                  {i < 4 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
