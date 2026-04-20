'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  User,
  UserCircle,
  Users,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth, authFetch } from '@/lib/auth-context';
import { StatusBadge, PriorityBadge } from '@/components/shared/badges';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface CaseItem {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  subcategory: string | null;
  applicantName: string;
  applicantIc: string;
  applicantPhone: string;
  applicantEmail: string | null;
  applicantAddress: string | null;
  householdSize: number;
  monthlyIncome: number;
  programmeId: string | null;
  assignedTo: string | null;
  notes: string | null;
  verificationScore: number | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  followUpDate: string | null;
  programme?: { id: string; name: string; code: string } | null;
  assignee?: { id: string; name: string; role: string } | null;
  verifier?: { id: string; name: string } | null;
  approver?: { id: string; name: string } | null;
  _count?: { caseNotes: number; disbursements: number; documents: number };
}

interface CaseDetail extends CaseItem {
  totalDisbursed?: number;
  caseNotes?: CaseNote[];
  disbursements?: unknown[];
  documents?: unknown[];
}

interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  type: string;
  content: string;
  createdAt: string;
  author?: { id: string; name: string; role: string; avatar: string | null } | null;
}

interface Programme {
  id: string;
  name: string;
  code?: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_TRANSITIONS: Record<string, { to: string; label: string; icon?: typeof ArrowRight; variant?: 'default' | 'destructive' | 'outline' }[]> = {
  draft: [
    { to: 'submitted', label: 'Hantar', icon: Send, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  submitted: [
    { to: 'verifying', label: 'Mula Verifikasi', icon: ClipboardList, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  verifying: [
    { to: 'verified', label: 'Sahkan', icon: CheckCircle2, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  verified: [
    { to: 'scoring', label: 'Mula Penilaian', icon: ClipboardList, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  scoring: [
    { to: 'scored', label: 'Selesai Penilaian', icon: CheckCircle2, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  scored: [
    { to: 'approved', label: 'Luluskan', icon: CheckCircle2, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  approved: [
    { to: 'disbursing', label: 'Mula Pengagihan', icon: Send, variant: 'default' },
    { to: 'rejected', label: 'Tolak', icon: Ban, variant: 'destructive' },
  ],
  disbursing: [
    { to: 'disbursed', label: 'Siap Agih', icon: CheckCircle2, variant: 'default' },
    { to: 'failed', label: 'Gagal', icon: AlertTriangle, variant: 'destructive' },
  ],
  disbursed: [
    { to: 'follow_up', label: 'Susulan', icon: RotateCcw, variant: 'outline' },
    { to: 'closed', label: 'Tutup', icon: CheckCircle2, variant: 'outline' },
  ],
  follow_up: [
    { to: 'closed', label: 'Tutup', icon: CheckCircle2, variant: 'outline' },
    { to: 'disbursing', label: 'Agih Semula', icon: Send, variant: 'default' },
  ],
  closed: [],
  rejected: [
    { to: 'draft', label: 'Buat Semula', icon: RotateCcw, variant: 'outline' },
  ],
  failed: [
    { to: 'disbursing', label: 'Cuba Semula', icon: RotateCcw, variant: 'default' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  zakat: 'Zakat',
  sedekah: 'Sedekah',
  wakaf: 'Wakaf',
  infak: 'Infak',
  government_aid: 'Bantuan Kerajaan',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  note: 'Nota',
  phone_call: 'Panggilan Telefon',
  visit: 'Lawatan',
  assessment: 'Penilaian',
  document: 'Dokumen',
  status_change: 'Perubahan Status',
  system: 'Sistem',
};

const PIPELINE_STAGES = [
  {
    key: 'pending',
    label: 'Menunggu',
    statuses: ['draft', 'submitted', 'verifying'],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-l-amber-500',
  },
  {
    key: 'active',
    label: 'Aktif',
    statuses: ['approved', 'disbursing', 'disbursed', 'follow_up'],
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-l-green-500',
  },
  {
    key: 'closed',
    label: 'Ditutup',
    statuses: ['closed'],
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
    borderColor: 'border-l-gray-400',
  },
  {
    key: 'rejected',
    label: 'Ditolak',
    statuses: ['rejected', 'failed'],
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-l-red-500',
  },
];

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNoteTypeIcon(type: string) {
  switch (type) {
    case 'phone_call': return Phone;
    case 'visit': return UserCircle;
    case 'assessment': return ClipboardList;
    case 'document': return FileText;
    case 'status_change': return ArrowRight;
    case 'system': return Building2;
    default: return MessageSquare;
  }
}

// ═══════════════════════════════════════════════════════════════
// Pipeline Cards Component
// ═══════════════════════════════════════════════════════════════

function PipelineCards({ cases }: { cases: CaseItem[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return map;
  }, [cases]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {PIPELINE_STAGES.map((stage) => {
        const count = stage.statuses.reduce((sum, s) => sum + (counts[s] || 0), 0);
        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: PIPELINE_STAGES.indexOf(stage) * 0.05 }}
          >
            <Card className={cn('border-l-4 transition-shadow hover:shadow-md', stage.borderColor)}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stage.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className={cn('text-2xl font-bold', stage.color)}>
                  {count}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {stage.statuses.map((s) => {
                    const sc = counts[s] || 0;
                    return sc > 0 ? `${sc} ${s.replace('_', ' ')}` : '';
                  }).filter(Boolean).join(' · ') || 'Tiada'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function PipelineCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// New Case Dialog
// ═══════════════════════════════════════════════════════════════

function NewCaseDialog({
  open,
  onOpenChange,
  programmes,
  users,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmes: Programme[];
  users: UserOption[];
  onCreated: () => void;
}) {
  const { token, user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as string,
    category: 'zakat' as string,
    subcategory: '',
    applicantName: '',
    applicantIc: '',
    applicantPhone: '',
    applicantEmail: '',
    applicantAddress: '',
    householdSize: '1',
    monthlyIncome: '0',
    programmeId: '',
    notes: '',
    submitLater: false,
  });

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      priority: 'normal',
      category: 'zakat',
      subcategory: '',
      applicantName: '',
      applicantIc: '',
      applicantPhone: '',
      applicantEmail: '',
      applicantAddress: '',
      householdSize: '1',
      monthlyIncome: '0',
      programmeId: '',
      notes: '',
      submitLater: false,
    });
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.applicantName.trim()) {
      toast.error('Nama pemohon diperlukan');
      return;
    }
    if (!form.applicantIc.trim() || !/^\d{6}-\d{2}-\d{4}$/.test(form.applicantIc)) {
      toast.error('No. IC tidak sah. Format: XXXXXX-XX-XXXX');
      return;
    }
    if (!form.applicantPhone.trim() || form.applicantPhone.length < 7) {
      toast.error('No. telefon tidak sah');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        applicantName: form.applicantName.trim(),
        applicantIc: form.applicantIc.trim(),
        applicantPhone: form.applicantPhone.trim(),
        applicantEmail: form.applicantEmail.trim() || undefined,
        applicantAddress: form.applicantAddress.trim() || undefined,
        householdSize: parseInt(form.householdSize) || 1,
        monthlyIncome: parseFloat(form.monthlyIncome) || 0,
        priority: form.priority,
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        programmeId: form.programmeId || undefined,
        notes: form.notes.trim() || undefined,
        submitLater: form.submitLater,
      };

      const res = await authFetch('/api/v1/cases', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal mencipta kes');
      }

      toast.success(form.submitLater ? 'Draf kes berjaya disimpan' : 'Kes berjaya dihantar');
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ralat tidak diketahui');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Kes Baharu
          </DialogTitle>
          <DialogDescription>
            Isi maklumat pemohon dan butiran kes untuk mendaftar kes baharu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Applicant Information ── */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              Maklumat Pemohon
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Pemohon <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nama penuh pemohon"
                  value={form.applicantName}
                  onChange={(e) => updateField('applicantName', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>No. Kad Pengenalan <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="XXXXXX-XX-XXXX"
                  value={form.applicantIc}
                  onChange={(e) => updateField('applicantIc', e.target.value)}
                  maxLength={14}
                />
              </div>
              <div className="space-y-1.5">
                <Label>No. Telefon <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="01x-xxxxxxx"
                  value={form.applicantPhone}
                  onChange={(e) => updateField('applicantPhone', e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Emel</Label>
                <Input
                  type="email"
                  placeholder="pemohon@contoh.com"
                  value={form.applicantEmail}
                  onChange={(e) => updateField('applicantEmail', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Alamat</Label>
                <Textarea
                  placeholder="Alamat penuh pemohon"
                  rows={2}
                  value={form.applicantAddress}
                  onChange={(e) => updateField('applicantAddress', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Saiz Isi Rumah</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.householdSize}
                  onChange={(e) => updateField('householdSize', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pendapatan Bulanan (RM)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.monthlyIncome}
                  onChange={(e) => updateField('monthlyIncome', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Case Details ── */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Butiran Kes
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tajuk Kes</Label>
                <Input
                  placeholder="Tajuk ringkas kes"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zakat">Zakat</SelectItem>
                    <SelectItem value="sedekah">Sedekah</SelectItem>
                    <SelectItem value="wakaf">Wakaf</SelectItem>
                    <SelectItem value="infak">Infak</SelectItem>
                    <SelectItem value="government_aid">Bantuan Kerajaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioriti</Label>
                <Select value={form.priority} onValueChange={(v) => updateField('priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Mendesak</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subkategori</Label>
                <Input
                  placeholder="Subkategori (pilihan)"
                  value={form.subcategory}
                  onChange={(e) => updateField('subcategory', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Program</Label>
                <Select
                  value={form.programmeId || '__none__'}
                  onValueChange={(v) => updateField('programmeId', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih program (pilihan)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tiada Program</SelectItem>
                    {programmes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ''}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Keterangan</Label>
                <Textarea
                  placeholder="Keterangan lanjut mengenai kes ini"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Catatan</Label>
                <Textarea
                  placeholder="Catatan tambahan (pilihan)"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Submit Options ── */}
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
            <input
              type="checkbox"
              id="submitLater"
              checked={form.submitLater}
              onChange={(e) => updateField('submitLater', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="submitLater" className="text-sm cursor-pointer">
              Simpan sebagai draf (hantar kemudian)
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : form.submitLater ? (
              <>
                <FileText className="h-4 w-4" />
                Simpan Draf
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Cipta & Hantar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// Case Detail Sheet
// ═══════════════════════════════════════════════════════════════

function CaseDetailSheet({
  open,
  onOpenChange,
  caseId,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string | null;
  onUpdated: () => void;
}) {
  const { token, user: currentUser } = useAuth();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Note form
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('note');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Status transition
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transitioningStatus, setTransitioningStatus] = useState<string | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreValue, setScoreValue] = useState('');

  const fetchCaseDetail = useCallback(async () => {
    if (!caseId || !token) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/v1/cases/${caseId}`, token);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuatkan kes');
      setCaseData(json.data);
      setNotes(json.data?.caseNotes || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuatkan butiran kes');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, token, onOpenChange]);

  useEffect(() => {
    if (open && caseId) {
      fetchCaseDetail();
      setActiveTab('details');
      setNewNoteContent('');
    } else {
      setCaseData(null);
      setNotes([]);
    }
  }, [open, caseId, fetchCaseDetail]);

  const handleTransition = async (newStatus: string) => {
    if (!caseId || !token) return;

    // If rejecting, show dialog first
    if (newStatus === 'rejected') {
      setTransitioningStatus(newStatus);
      setShowRejectDialog(true);
      return;
    }

    // If transitioning to scored, show score dialog
    if (newStatus === 'scored') {
      setTransitioningStatus(newStatus);
      setShowScoreDialog(true);
      return;
    }

    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'follow_up') {
        payload.followUpDate = new Date().toISOString();
      }

      const res = await authFetch(`/api/v1/cases/${caseId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengubah status');

      toast.success('Status berjaya dikemaskini');
      fetchCaseDetail();
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const handleRejectConfirm = async () => {
    if (!caseId || !token || !rejectionReason.trim()) {
      toast.error('Sebab penolakan diperlukan');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/cases/${caseId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menolak kes');

      toast.success('Kes berjaya ditolak');
      setShowRejectDialog(false);
      setRejectionReason('');
      setTransitioningStatus(null);
      fetchCaseDetail();
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menolak kes');
    }
  };

  const handleScoreConfirm = async () => {
    if (!caseId || !token) return;
    const score = parseInt(scoreValue);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Skor mesti antara 0-100');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/cases/${caseId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'scored',
          verificationScore: score,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengemaskini skor');

      toast.success(`Penilaian selesai. Skor: ${score}/100`);
      setShowScoreDialog(false);
      setScoreValue('');
      setTransitioningStatus(null);
      fetchCaseDetail();
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengemaskini skor');
    }
  };

  const handleAddNote = async () => {
    if (!caseId || !token || !currentUser) return;
    if (!newNoteContent.trim()) {
      toast.error('Kandungan nota diperlukan');
      return;
    }

    setIsAddingNote(true);
    try {
      const res = await authFetch(`/api/v1/cases/${caseId}/notes`, token, {
        method: 'POST',
        body: JSON.stringify({
          authorId: currentUser.id,
          type: newNoteType,
          content: newNoteContent.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menambah nota');

      toast.success('Nota berjaya ditambah');
      setNewNoteContent('');
      // Re-fetch to get the note with author info
      const notesRes = await authFetch(`/api/v1/cases/${caseId}/notes`, token);
      const notesJson = await notesRes.json();
      if (notesRes.ok) {
        setNotes(notesJson.data || []);
      }
      fetchCaseDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah nota');
    } finally {
      setIsAddingNote(false);
    }
  };

  const availableTransitions = caseData
    ? STATUS_TRANSITIONS[caseData.status] || []
    : [];

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0">
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Separator />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!caseData) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4 space-y-3 border-b shrink-0">
            <SheetHeader>
              <SheetTitle className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-muted-foreground">{caseData.caseNumber}</span>
                  <h2 className="text-lg font-semibold leading-tight">{caseData.title || caseData.applicantName}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={caseData.status} />
                  <PriorityBadge priority={caseData.priority} />
                </div>
              </SheetTitle>
            </SheetHeader>

            {/* Quick Info Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {caseData.applicantName}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {CATEGORY_LABELS[caseData.category] || caseData.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(caseData.createdAt)}
              </span>
              {caseData.assignee && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {caseData.assignee.name}
                </span>
              )}
            </div>

            {/* Status Transition Buttons */}
            {availableTransitions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map((t) => {
                  const Icon = t.icon || ArrowRight;
                  return (
                    <Button
                      key={t.to}
                      size="sm"
                      variant={t.variant || 'default'}
                      onClick={() => handleTransition(t.to)}
                      className="gap-1.5 text-xs"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                      <ArrowRight className="h-3 w-3 opacity-50" />
                      <StatusBadge status={t.to} className="ml-1 text-[10px] px-1.5 py-0" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-3 shrink-0">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1 gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Butiran
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Nota
                  {notes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1">
                      {notes.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              {/* ── Details Tab ── */}
              <TabsContent value="details" className="m-0 p-6 space-y-4 mt-0">
                {/* Applicant Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    Maklumat Pemohon
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Nama" value={caseData.applicantName} />
                    <DetailItem label="No. IC" value={caseData.applicantIc} />
                    <DetailItem label="No. Telefon" value={caseData.applicantPhone} />
                    <DetailItem label="Emel" value={caseData.applicantEmail || '-'} />
                    <DetailItem label="Alamat" value={caseData.applicantAddress || '-'} className="col-span-2" />
                    <DetailItem label="Saiz Isi Rumah" value={String(caseData.householdSize)} />
                    <DetailItem label="Pendapatan Bulanan" value={formatCurrency(caseData.monthlyIncome)} highlight />
                  </div>
                </div>

                <Separator />

                {/* Case Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Butiran Kes
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="No. Kes" value={caseData.caseNumber} mono />
                    <DetailItem label="Kategori" value={CATEGORY_LABELS[caseData.category] || caseData.category} />
                    {caseData.subcategory && (
                      <DetailItem label="Subkategori" value={caseData.subcategory} />
                    )}
                    <DetailItem label="Prioriti">
                      <PriorityBadge priority={caseData.priority} />
                    </DetailItem>
                    <DetailItem label="Program" value={caseData.programme?.name || '-'} />
                    <DetailItem label="Ditetapkan Kepada" value={caseData.assignee?.name || '-'} />
                    {caseData.verificationScore !== null && caseData.verificationScore !== undefined && (
                      <DetailItem label="Skor Penilaian" value={`${caseData.verificationScore}/100`} highlight />
                    )}
                    <DetailItem label="Jumlah Diagihkan" value={formatCurrency(caseData.totalDisbursed || 0)} highlight />
                  </div>
                </div>

                {caseData.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Keterangan</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                        {caseData.description}
                      </p>
                    </div>
                  </>
                )}

                {caseData.rejectionReason && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Sebab Penolakan</p>
                      <p className="text-sm text-red-600 dark:text-red-300">{caseData.rejectionReason}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Sejarah
                  </h4>
                  <div className="space-y-2 text-sm">
                    <TimelineItem label="Dicipta" date={caseData.createdAt} />
                    {caseData.verifiedAt && (
                      <TimelineItem label="Disahkan" date={caseData.verifiedAt} by={caseData.verifier?.name} />
                    )}
                    {caseData.approvedAt && (
                      <TimelineItem label="Diluluskan" date={caseData.approvedAt} by={caseData.approver?.name} />
                    )}
                    {caseData.followUpDate && (
                      <TimelineItem label="Tarikh Susulan" date={caseData.followUpDate} />
                    )}
                    {caseData.closedAt && (
                      <TimelineItem label="Ditutup" date={caseData.closedAt} />
                    )}
                    <TimelineItem label="Dikemaskini" date={caseData.updatedAt} />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {(caseData._count?.caseNotes ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {caseData._count?.caseNotes} nota
                    </span>
                  )}
                  {(caseData._count?.disbursements ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {caseData._count?.disbursements} pengagihan
                    </span>
                  )}
                  {(caseData._count?.documents ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {caseData._count?.documents} dokumen
                    </span>
                  )}
                </div>
              </TabsContent>

              {/* ── Notes Tab ── */}
              <TabsContent value="notes" className="m-0 p-6 space-y-4 mt-0">
                {/* Add Note Form */}
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Tambah Nota</Label>
                    <Select value={newNoteType} onValueChange={setNewNoteType}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Nota</SelectItem>
                        <SelectItem value="phone_call">Panggilan Telefon</SelectItem>
                        <SelectItem value="visit">Lawatan</SelectItem>
                        <SelectItem value="assessment">Penilaian</SelectItem>
                        <SelectItem value="document">Dokumen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Tulis nota di sini..."
                    rows={3}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={isAddingNote || !newNoteContent.trim()}
                      className="gap-1.5"
                    >
                      {isAddingNote ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Hantar
                    </Button>
                  </div>
                </div>

                {/* Notes Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Semua Nota ({notes.length})</h4>
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Tiada nota untuk kes ini</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note, idx) => {
                        const NoteIcon = getNoteTypeIcon(note.type);
                        const isSystem = note.type === 'system' || note.type === 'status_change';
                        return (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(idx, 10) * 0.03 }}
                            className={cn(
                              'rounded-lg border p-3',
                              isSystem
                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
                                : 'bg-card'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs',
                                  isSystem
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  <NoteIcon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm font-medium">
                                  {note.author?.name || 'Pengguna'}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {NOTE_TYPE_LABELS[note.type] || note.type}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground pl-8 whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={(v) => { setShowRejectDialog(v); if (!v) setRejectionReason(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Tolak Kes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak kes <span className="font-semibold">{caseData.caseNumber}</span>.
              Sila nyatakan sebab penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Sebab penolakan..."
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Tolak Kes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Score Input Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={(v) => { setShowScoreDialog(v); if (!v) setScoreValue(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Penilaian Kes
            </DialogTitle>
            <DialogDescription>
              Masukkan skor penilaian untuk kes {caseData.caseNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Skor Penilaian (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Skor 0 = paling rendah, 100 = paling tinggi
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoreDialog(false)}>Batal</Button>
            <Button onClick={handleScoreConfirm}>Simpan Penilaian</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function DetailItem({
  label,
  value,
  children,
  mono,
  highlight,
  className,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border p-2.5', highlight && 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', className)}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {children ? (
        <div className="mt-0.5">{children}</div>
      ) : (
        <p className={cn(
          'text-sm font-medium mt-0.5',
          mono && 'font-mono text-xs',
          highlight && 'text-purple-700 dark:text-purple-400 font-bold',
        )}>
          {value}
        </p>
      )}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  by,
}: {
  label: string;
  date: string | null | undefined;
  by?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {formatDateTime(date)}
        {by && <span className="text-muted-foreground font-normal ml-2">oleh {by}</span>}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════════════════

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground size-8" />
      </div>
      <div>
        <p className="font-medium">Tiada kes ditemui</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {hasFilters
            ? 'Cuba ubah penapis carian anda.'
            : 'Mulakan dengan menambah kes baharu.'}
        </p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════

export default function CasesPage() {
  const { token } = useAuth();

  // Data state
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [allCasesForPipeline, setAllCasesForPipeline] = useState<CaseItem[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 15, total: 0, totalPages: 0 });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Dialog state
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

  // ── Fetch reference data (programmes & users) ──
  const fetchReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      const [progRes, userRes] = await Promise.all([
        authFetch('/api/v1/programmes?limit=100', token),
        authFetch('/api/v1/users?limit=100', token),
      ]);

      if (progRes.ok) {
        const progJson = await progRes.json();
        setProgrammes((progJson.data || []).map((p: Record<string, string>) => ({
          id: p.id,
          name: p.name,
          code: p.code,
        })));
      }
      if (userRes.ok) {
        const userJson = await userRes.json();
        setUsers((userJson.data || []).map((u: Record<string, string>) => ({
          id: u.id,
          name: u.name,
          role: u.role,
        })));
      }
    } catch {
      // Silently fail - reference data is optional for table rendering
    }
  }, [token]);

  // ── Fetch pipeline counts (all cases, no pagination) ──
  const fetchPipelineCounts = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      params.set('limit', '1000');
      const res = await authFetch(`/api/v1/cases?${params.toString()}`, token);
      if (res.ok) {
        const json = await res.json();
        setAllCasesForPipeline(json.data || []);
      }
    } catch {
      // Silently fail
    }
  }, [token]);

  // ── Fetch cases (paginated, with filters) ──
  const fetchCases = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await authFetch(`/api/v1/cases?${params.toString()}`, token);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Gagal memuatkan kes');

      setCases(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuatkan senarai kes');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [token, search, statusFilter, priorityFilter, categoryFilter, page]);

  // ── Initial load ──
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchCases();
    fetchPipelineCounts();
  }, [fetchCases, fetchPipelineCounts]);

  // ── Reset page when filters change ──
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  // ── Handlers ──
  const handleRowClick = (caseItem: CaseItem) => {
    setSelectedCaseId(caseItem.id);
    setIsDetailOpen(true);
  };

  const handleCaseCreated = () => {
    fetchCases();
    fetchPipelineCounts();
  };

  const handleCaseUpdated = () => {
    fetchCases();
    fetchPipelineCounts();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const pageRange = useMemo(() => {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, pagination.total);
    return pagination.total > 0 ? `${start}–${end} daripada ${pagination.total}` : '0';
  }, [page, pagination.total, limit]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pengurusan Kes</h1>
          <p className="text-muted-foreground">Pengurusan kes untuk asnaf dan penerima bantuan</p>
        </div>
        <Button onClick={() => setIsNewCaseOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Kes Baharu
        </Button>
      </motion.div>

      {/* ── Pipeline Overview ── */}
      {isInitialLoading ? (
        <PipelineCardsSkeleton />
      ) : (
        <PipelineCards cases={allCasesForPipeline} />
      )}

      {/* ── Search & Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kes, nama pemohon, no. IC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draf</SelectItem>
                  <SelectItem value="submitted">Hantaran</SelectItem>
                  <SelectItem value="verifying">Verifikasi</SelectItem>
                  <SelectItem value="verified">Disahkan</SelectItem>
                  <SelectItem value="scoring">Penilaian</SelectItem>
                  <SelectItem value="scored">Dinilai</SelectItem>
                  <SelectItem value="approved">Diluluskan</SelectItem>
                  <SelectItem value="disbursing">Pengagihan</SelectItem>
                  <SelectItem value="disbursed">Diagihkan</SelectItem>
                  <SelectItem value="follow_up">Susulan</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Prioriti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioriti</SelectItem>
                  <SelectItem value="urgent">Mendesak</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="zakat">Zakat</SelectItem>
                  <SelectItem value="sedekah">Sedekah</SelectItem>
                  <SelectItem value="wakaf">Wakaf</SelectItem>
                  <SelectItem value="infak">Infak</SelectItem>
                  <SelectItem value="government_aid">Bantuan Kerajaan</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filters */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <X className="h-3 w-3" />
                  Set Semula
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cases Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Senarai Kes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : cases.length === 0 ? (
              <EmptyState hasFilters={!!hasFilters} />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[130px]">No. Kes</TableHead>
                        <TableHead>Pemohon</TableHead>
                        <TableHead className="w-[100px]">Kategori</TableHead>
                        <TableHead className="w-[90px]">Prioriti</TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead className="w-[100px]">Program</TableHead>
                        <TableHead className="w-[110px]">Ditetapkan</TableHead>
                        <TableHead className="w-[100px]">Tarikh</TableHead>
                        <TableHead className="w-[60px] text-center">Not.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c, idx) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => handleRowClick(c)}
                        >
                          <TableCell className="font-mono text-xs">{c.caseNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{c.applicantName}</p>
                              <p className="text-xs text-muted-foreground">{c.applicantIc}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {CATEGORY_LABELS[c.category] || c.category}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={c.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.programme?.name || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.assignee?.name || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {c._count?.caseNotes || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {cases.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70"
                      onClick={() => handleRowClick(c)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm">{c.applicantName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{c.caseNumber}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={c.priority} />
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{c.applicantIc}</span>
                        <span>·</span>
                        <span>{CATEGORY_LABELS[c.category] || c.category}</span>
                        {c.programme && (
                          <>
                            <span>·</span>
                            <span>{c.programme.name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(c.createdAt)}</span>
                        {c.assignee && (
                          <span className="flex items-center gap-1">
                            <UserCircle className="h-3 w-3" /> {c.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {pageRange} kes
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page buttons - show max 5 */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="icon"
                            className="h-8 w-8 text-xs"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── New Case Dialog ── */}
      <NewCaseDialog
        open={isNewCaseOpen}
        onOpenChange={setIsNewCaseOpen}
        programmes={programmes}
        users={users}
        onCreated={handleCaseCreated}
      />

      {/* ── Case Detail Sheet ── */}
      <CaseDetailSheet
        open={isDetailOpen}
        onOpenChange={(v) => {
          setIsDetailOpen(v);
          if (!v) setSelectedCaseId(null);
        }}
        caseId={selectedCaseId}
        onUpdated={handleCaseUpdated}
      />
    </div>
  );
}
