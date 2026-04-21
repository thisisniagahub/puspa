'use client';

import { useEffect, useState } from 'react';
import { Wallet, CalendarClock, AlertTriangle, ArrowRightLeft, User } from 'lucide-react';
import { useAuth, authFetch } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DisbursementItem {
  id: string;
  disbursementNumber: string;
  amount: number;
  method: string;
  status: string;
  purpose: string;
  scheduledDate: string | null;
  processedDate: string | null;
  recipientName: string;
  case?: { caseNumber: string; applicantName: string } | null;
  programme?: { name: string; code?: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Diluluskan',
  processing: 'Diproses',
  completed: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const className = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  }[status] ?? 'bg-muted text-foreground';

  return <Badge className={className}>{label}</Badge>;
}

export default function DisbursementsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await authFetch('/api/v1/disbursements?limit=50', token);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Gagal memuatkan pengagihan');
        if (!cancelled) {
          setItems(json.data ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuatkan pengagihan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const completedCount = items.filter((item) => item.status === 'completed').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-red-500" />
        <p className="font-semibold">Gagal memuatkan pengagihan</p>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Cuba lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengagihan</h1>
        <p className="text-muted-foreground">Pantau aliran bantuan yang sedang diproses dan telah selesai.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total diagih</CardDescription><CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" />{items.length} rekod pengagihan</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Menunggu tindakan</CardDescription><CardTitle className="text-2xl">{pendingCount}</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" />Perlu kelulusan atau pemprosesan</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Selesai</CardDescription><CardTitle className="text-2xl">{completedCount}</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowRightLeft className="h-4 w-4" />Bantuan berjaya disalurkan</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senarai Pengagihan</CardTitle>
          <CardDescription>{items.length === 0 ? 'Belum ada pengagihan direkod.' : '50 rekod terkini dari sistem pengagihan.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Tiada rekod pengagihan lagi.</div>
          ) : items.map((item) => (
            <div key={item.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/30">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{item.disbursementNumber}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-base font-semibold">{item.recipientName}</p>
                  <p className="text-sm text-muted-foreground">{item.purpose}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{item.case?.caseNumber ?? 'Tiada kes'}</span>
                    <span>{item.programme?.name ?? 'Tiada program'}</span>
                    <span>Jadual: {formatDate(item.scheduledDate)}</span>
                    <span>Proses: {formatDate(item.processedDate)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.method.replaceAll('_', ' ')}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
