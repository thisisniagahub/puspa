'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  User,
  Wallet,
} from 'lucide-react';

import { useAuth, authFetch } from '@/lib/auth-context';
import { StatusBadge } from '@/components/shared/badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

interface DisbursementItem {
  id: string;
  disbursementNumber: string;
  amount: number;
  method: string;
  status: string;
  purpose: string;
  notes?: string | null;
  scheduledDate: string | null;
  processedDate: string | null;
  recipientName: string;
  recipientIc: string;
  recipientPhone?: string | null;
  case?: { id: string; caseNumber: string; applicantName: string; status?: string } | null;
  programme?: { name: string; code?: string | null } | null;
}

interface CaseOption {
  id: string;
  caseNumber: string;
  applicantName: string;
  applicantIc: string;
  applicantPhone?: string | null;
  status: string;
  programme?: { id: string; name: string; code?: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Diluluskan',
  processing: 'Diproses',
  completed: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Pindahan Bank',
  cash: 'Tunai',
  cheque: 'Cek',
  ewallet: 'E-Wallet',
};

const FILTERS = [
  { value: 'all', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Diluluskan' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'failed', label: 'Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getNextAction(status: string) {
  switch (status) {
    case 'pending':
      return { to: 'approved', label: 'Luluskan' };
    case 'approved':
      return { to: 'processing', label: 'Mula Proses' };
    case 'processing':
      return { to: 'completed', label: 'Tandakan Selesai' };
    case 'failed':
      return { to: 'pending', label: 'Cuba Semula' };
    default:
      return null;
  }
}

function CreateDisbursementDialog({
  cases,
  loading,
  open,
  onOpenChange,
  onCreate,
}: {
  cases: CaseOption[];
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    caseId: string;
    amount: number;
    method: string;
    recipientName: string;
    recipientIc: string;
    recipientPhone?: string;
    purpose: string;
    notes?: string;
    scheduledDate?: string;
  }) => Promise<void>;
}) {
  const [caseId, setCaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [recipientName, setRecipientName] = useState('');
  const [recipientIc, setRecipientIc] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [purpose, setPurpose] = useState('Bantuan asnaf');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const resetForm = () => {
    setCaseId('');
    setAmount('');
    setMethod('bank_transfer');
    setRecipientName('');
    setRecipientIc('');
    setRecipientPhone('');
    setPurpose('Bantuan asnaf');
    setNotes('');
    setScheduledDate('');
  };

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === caseId) ?? null,
    [caseId, cases]
  );

  const handleCaseChange = (value: string) => {
    setCaseId(value);

    const nextCase = cases.find((item) => item.id === value);
    if (!nextCase) return;

    setRecipientName(nextCase.applicantName);
    setRecipientIc(nextCase.applicantIc);
    setRecipientPhone(nextCase.applicantPhone ?? '');
    setPurpose(`Bantuan untuk kes ${nextCase.caseNumber}`);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const submit = async () => {
    const parsedAmount = Number(amount);
    if (!caseId || !parsedAmount || parsedAmount <= 0 || !recipientName.trim() || !recipientIc.trim() || !purpose.trim()) {
      toast.error('Lengkapkan maklumat pengagihan dahulu');
      return;
    }

    await onCreate({
      caseId,
      amount: parsedAmount,
      method,
      recipientName: recipientName.trim(),
      recipientIc: recipientIc.trim(),
      recipientPhone: recipientPhone.trim() || undefined,
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
      scheduledDate: scheduledDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Rekod Pengagihan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rekod pengagihan baharu</DialogTitle>
          <DialogDescription>
            Pilih kes yang telah diluluskan, kemudian rekodkan butiran bantuan untuk diproses.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Pilih kes</Label>
            <Select value={caseId} onValueChange={handleCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder={cases.length === 0 ? 'Tiada kes layak untuk pengagihan' : 'Pilih kes'} />
              </SelectTrigger>
              <SelectContent>
                {cases.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.caseNumber} · {item.applicantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCase && (
              <p className="text-xs text-muted-foreground">
                Status semasa: {selectedCase.status.replaceAll('_', ' ')}
                {selectedCase.programme?.name ? ` · Program: ${selectedCase.programme.name}` : ''}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jumlah</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
          </div>
          <div className="space-y-2">
            <Label>Kaedah</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nama penerima</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>No. IC penerima</Label>
            <Input value={recipientIc} onChange={(e) => setRecipientIc(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>No. telefon</Label>
            <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="01X-XXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label>Tarikh dijadualkan</Label>
            <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tujuan</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Bantuan makanan / yuran / rawatan" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nota tambahan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Arahan pemprosesan, rujukan bank, atau catatan susulan" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={loading || cases.length === 0} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Pengagihan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DisbursementsPage() {
  const { token, hasPermission } = useAuth();
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const canManage = hasPermission('disbursements:create') || hasPermission('disbursements:update');

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [disbursementRes, casesRes] = await Promise.all([
        authFetch('/api/v1/disbursements?limit=100', token),
        authFetch('/api/v1/cases?limit=200&sortBy=updatedAt&sortOrder=desc', token),
      ]);

      const [disbursementJson, casesJson] = await Promise.all([
        disbursementRes.json(),
        casesRes.json(),
      ]);

      if (!disbursementRes.ok) throw new Error(disbursementJson.error ?? 'Gagal memuatkan pengagihan');
      if (!casesRes.ok) throw new Error(casesJson.error ?? 'Gagal memuatkan senarai kes');

      setItems(disbursementJson.data ?? []);
      setCases(casesJson.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuatkan pengagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadData();
  }, [token]);

  const eligibleCases = useMemo(
    () => cases.filter((item) => ['approved', 'disbursing', 'follow_up'].includes(item.status)),
    [cases]
  );

  const visibleItems = useMemo(
    () => filter === 'all' ? items : items.filter((item) => item.status === filter),
    [filter, items]
  );

  const totalAmount = visibleItems.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = items.filter((item) => ['pending', 'approved', 'processing'].includes(item.status)).length;
  const completedCount = items.filter((item) => item.status === 'completed').length;

  const createDisbursement = async (payload: {
    caseId: string;
    amount: number;
    method: string;
    recipientName: string;
    recipientIc: string;
    recipientPhone?: string;
    purpose: string;
    notes?: string;
    scheduledDate?: string;
  }) => {
    if (!token) return;

    try {
      setSubmitting(true);
      const res = await authFetch('/api/v1/disbursements', token, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          approvedBy: 'self',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal merekod pengagihan');

      toast.success('Pengagihan berjaya direkod');
      setCreateOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal merekod pengagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;

    try {
      setSubmitting(true);
      const res = await authFetch(`/api/v1/disbursements/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengemaskini pengagihan');

      toast.success(`Status pengagihan dikemaskini kepada ${STATUS_LABELS[status] ?? status}`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengemaskini pengagihan');
    } finally {
      setSubmitting(false);
    }
  };

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
        <ClipboardList className="mb-4 h-10 w-10 text-red-500" />
        <p className="font-semibold">Gagal memuatkan pengagihan</p>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => void loadData()}>Cuba lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengagihan</h1>
          <p className="text-muted-foreground">Pantau aliran bantuan dari kelulusan sehingga selesai diagihkan.</p>
        </div>
        {hasPermission('disbursements:create') && (
          <CreateDisbursementDialog
            cases={eligibleCases}
            loading={submitting}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreate={createDisbursement}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total diagih</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              {visibleItems.length} rekod dalam paparan semasa
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menunggu tindakan</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Termasuk diluluskan dan sedang diproses
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selesai</CardDescription>
            <CardTitle className="text-2xl">{completedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Bantuan berjaya disalurkan kepada penerima
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Senarai Pengagihan</CardTitle>
            <CardDescription>
              Urus status pengagihan, dan jejak kes yang sedang bergerak ke peringkat pembayaran.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Tiada rekod pengagihan untuk penapis ini.
            </div>
          ) : visibleItems.map((item) => {
            const nextAction = getNextAction(item.status);
            return (
              <div key={item.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.disbursementNumber}</span>
                      <StatusBadge status={item.status} />
                      {item.case?.status && <Badge variant="outline">Kes: {item.case.status.replaceAll('_', ' ')}</Badge>}
                    </div>
                    <p className="text-base font-semibold">{item.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{item.purpose}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{item.case?.caseNumber ?? 'Tiada kes'}</span>
                      <span>{item.programme?.name ?? 'Tiada program'}</span>
                      <span>Jadual: {formatDate(item.scheduledDate)}</span>
                      <span>Proses: {formatDate(item.processedDate)}</span>
                    </div>
                    {item.notes && (
                      <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{METHOD_LABELS[item.method] ?? item.method}</p>
                    </div>
                    {canManage && nextAction && hasPermission('disbursements:update') && (
                      <Button
                        size="sm"
                        onClick={() => void updateStatus(item.id, nextAction.to)}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {nextAction.label}
                      </Button>
                    )}
                    {!nextAction && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
