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
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  receiptFile?: string | null;
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

function getDisbursementIssues(item: DisbursementItem) {
  return [
    !item.scheduledDate && ['pending', 'approved', 'processing'].includes(item.status) ? 'Belum ada jadual proses' : null,
    item.method === 'bank_transfer' && (!item.bankName || !item.accountNumber || !item.accountHolder) ? 'Maklumat bank tak lengkap' : null,
    !item.recipientPhone ? 'Tiada nombor telefon penerima' : null,
    !item.recipientName ? 'Nama penerima tiada' : null,
    !item.recipientIc ? 'IC penerima tiada' : null,
    !item.purpose ? 'Tujuan pengagihan tiada' : null,
    item.status === 'completed' && !item.processedDate ? 'Selesai tanpa tarikh proses' : null,
  ].filter(Boolean) as string[];
}

function canAdvanceDisbursement(item: DisbursementItem, nextStatus: string | null) {
  if (!nextStatus) return true;
  if (!['processing', 'completed'].includes(nextStatus)) return true;

  return !getDisbursementIssues(item).some((issue) =>
    ['Maklumat bank tak lengkap', 'Nama penerima tiada', 'IC penerima tiada', 'Tujuan pengagihan tiada'].includes(issue)
  );
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

function EditDisbursementDialog({
  item,
  open,
  loading,
  onOpenChange,
  onSave,
}: {
  item: DisbursementItem | null;
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    recipientName: item?.recipientName ?? '',
    recipientIc: item?.recipientIc ?? '',
    recipientPhone: item?.recipientPhone ?? '',
    purpose: item?.purpose ?? '',
    notes: item?.notes ?? '',
    scheduledDate: item?.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : '',
    bankName: item?.bankName ?? '',
    accountNumber: item?.accountNumber ?? '',
    accountHolder: item?.accountHolder ?? '',
  });

  if (!item) return null;

  const submit = async () => {
    await onSave(item.id, {
      recipientName: form.recipientName.trim(),
      recipientIc: form.recipientIc.trim(),
      recipientPhone: form.recipientPhone.trim(),
      purpose: form.purpose.trim(),
      notes: form.notes.trim(),
      scheduledDate: form.scheduledDate || null,
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      accountHolder: form.accountHolder.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kemaskini pengagihan</DialogTitle>
          <DialogDescription>
            Lengkapkan maklumat remediation untuk {item.disbursementNumber} sebelum gerakkan payout ke peringkat seterusnya.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama penerima</Label>
            <Input value={form.recipientName} onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>No. IC penerima</Label>
            <Input value={form.recipientIc} onChange={(e) => setForm((prev) => ({ ...prev, recipientIc: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>No. telefon penerima</Label>
            <Input value={form.recipientPhone} onChange={(e) => setForm((prev) => ({ ...prev, recipientPhone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Tarikh dijadualkan</Label>
            <Input type="date" value={form.scheduledDate} onChange={(e) => setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tujuan</Label>
            <Input value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
          </div>

          {item.method === 'bank_transfer' && (
            <>
              <div className="space-y-2">
                <Label>Nama bank</Label>
                <Input value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>No. akaun</Label>
                <Input value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nama pemegang akaun</Label>
                <Input value={form.accountHolder} onChange={(e) => setForm((prev) => ({ ...prev, accountHolder: e.target.value }))} />
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label>Nota tambahan</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Kemaskini
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
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisbursementItem | null>(null);
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
  const scheduleGapCount = items.filter((item) => ['pending', 'approved', 'processing'].includes(item.status) && !item.scheduledDate).length;
  const bankInfoGapCount = items.filter((item) => item.method === 'bank_transfer' && (!item.bankName || !item.accountNumber || !item.accountHolder)).length;
  const contactGapCount = items.filter((item) => !item.recipientPhone).length;

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

  const saveDisbursement = async (id: string, payload: Record<string, unknown>) => {
    if (!token) return;

    try {
      setSubmitting(true);
      const res = await authFetch(`/api/v1/disbursements/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan pengagihan');

      toast.success('Maklumat pengagihan berjaya dikemaskini');
      setEditOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengagihan');
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

      <EditDisbursementDialog
        key={selectedItem?.id ?? 'none'}
        item={selectedItem}
        open={editOpen}
        loading={submitting}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen);
          if (!nextOpen) setSelectedItem(null);
        }}
        onSave={saveDisbursement}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jadual belum set</CardDescription>
            <CardTitle className="text-2xl">{scheduleGapCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Queue yang belum ada tarikh proses
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maklumat bank tak lengkap</CardDescription>
            <CardTitle className="text-2xl">{bankInfoGapCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Untuk pindahan bank sahaja
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contact gap</CardDescription>
            <CardTitle className="text-2xl">{contactGapCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Penerima tiada nombor telefon
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
            const issues = getDisbursementIssues(item);
            const canAdvance = canAdvanceDisbursement(item, nextAction?.to ?? null);
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
                    {issues.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-3">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Ops / Reconciliation flags</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <Badge key={issue} variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{METHOD_LABELS[item.method] ?? item.method}</p>
                    </div>
                    {canManage && hasPermission('disbursements:update') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setEditOpen(true);
                        }}
                      >
                        Kemaskini
                      </Button>
                    )}
                    {canManage && nextAction && hasPermission('disbursements:update') && (
                      <Button
                        size="sm"
                        onClick={() => void updateStatus(item.id, nextAction.to)}
                        disabled={submitting || !canAdvance}
                        className="gap-2"
                      >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {nextAction.label}
                      </Button>
                    )}
                    {nextAction && !canAdvance && (
                      <p className="max-w-[220px] text-[11px] text-amber-600 dark:text-amber-300 lg:text-right">
                        Lengkapkan remediation dulu sebelum status boleh digerakkan.
                      </p>
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
