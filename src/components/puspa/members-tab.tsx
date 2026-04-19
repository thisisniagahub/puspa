'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Loader2,
  UserCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  DollarSign,
  UsersRound,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Member {
  id: string;
  name: string;
  icNumber: string;
  phone: string;
  email: string | null;
  address: string | null;
  category: string;
  status: string;
  joinDate: string;
  familyMembers: number;
  monthlyIncome: number;
  notes: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  donations?: Donation[];
  programmeMembers?: ProgrammeMember[];
}

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  receiptNumber: string | null;
}

interface ProgrammeMember {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  programme: {
    id: string;
    name: string;
    category: string;
    status: string;
  };
}

interface MembersResponse {
  data: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'asnaf', label: 'Asnaf' },
  { value: 'volunteer', label: 'Sukarela' },
  { value: 'donor', label: 'Penderma' },
  { value: 'staff', label: 'Staf' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'suspended', label: 'Ditangguh' },
] as const;

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  asnaf: {
    label: 'Asnaf',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  volunteer: {
    label: 'Sukarela',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  donor: {
    label: 'Penderma',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  staff: {
    label: 'Staf',
    className:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Aktif',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  inactive: {
    label: 'Tidak Aktif',
    className:
      'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
  suspended: {
    label: 'Ditangguh',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
};

const CATEGORY_FORM_OPTIONS = [
  { value: 'asnaf', label: 'Asnaf' },
  { value: 'volunteer', label: 'Sukarela' },
  { value: 'donor', label: 'Penderma' },
  { value: 'staff', label: 'Staf' },
] as const;

const STATUS_FORM_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'suspended', label: 'Ditangguh' },
] as const;

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const memberFormSchema = z.object({
  name: z.string().min(1, 'Nama ahli diperlukan'),
  icNumber: z
    .string()
    .min(1, 'No. KP diperlukan')
    .min(12, 'No. KP mesti sekurang-kurangnya 12 aksara'),
  phone: z.string().min(1, 'No. telefon diperlukan'),
  email: z.string().email('Format e-mel tidak sah').or(z.literal('')).nullable().optional(),
  address: z.string().nullable().optional(),
  category: z.string().min(1, 'Kategori diperlukan'),
  status: z.string().min(1, 'Status diperlukan'),
  familyMembers: z.coerce.number().int().min(0, 'Mesti 0 atau lebih'),
  monthlyIncome: z.coerce.number().min(0, 'Mesti 0 atau lebih'),
  notes: z.string().nullable().optional(),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

// ---------------------------------------------------------------------------
// Helper: Format currency (MYR)
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return <Badge variant="outline">{category}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function MemberTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-emerald-50 p-4 mb-4 dark:bg-emerald-950">
        <Users className="h-10 w-10 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {hasFilters ? 'Tiada ahli dijumpai' : 'Tiada ahli lagi'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? 'Cuba ubah penapis carian anda untuk mendapatkan keputusan yang lebih baik.'
          : 'Mula dengan menambah ahli pertama anda menggunakan butang "Tambah Ahli" di atas.'}
      </p>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <p className="text-sm text-muted-foreground">
        Halaman {page} daripada {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberFormDialog — Add / Edit
// ---------------------------------------------------------------------------

function MemberFormDialog({
  open,
  onOpenChange,
  member,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSaved: () => void;
}) {
  const isEditing = !!member;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: '',
      icNumber: '',
      phone: '',
      email: '',
      address: '',
      category: 'asnaf',
      status: 'active',
      familyMembers: 1,
      monthlyIncome: 0,
      notes: '',
    },
  });

  // Reset form when dialog opens or member changes
  useEffect(() => {
    if (open) {
      form.reset(
        member
          ? {
              name: member.name,
              icNumber: member.icNumber,
              phone: member.phone,
              email: member.email ?? '',
              address: member.address ?? '',
              category: member.category,
              status: member.status,
              familyMembers: member.familyMembers,
              monthlyIncome: member.monthlyIncome,
              notes: member.notes ?? '',
            }
          : {
              name: '',
              icNumber: '',
              phone: '',
              email: '',
              address: '',
              category: 'asnaf',
              status: 'active',
              familyMembers: 1,
              monthlyIncome: 0,
              notes: '',
            }
      );
    }
  }, [open, member, form]);

  const onSubmit = async (values: MemberFormValues) => {
    setSubmitting(true);
    try {
      const url = member ? `/api/members/${member.id}` : '/api/members';
      const method = member ? 'PUT' : 'POST';

      const payload = {
        ...values,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan ahli');
      }

      toast.success(
        member ? 'Ahli berjaya dikemas kini' : 'Ahli berjaya ditambah'
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ralat tidak diketahui');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5 text-emerald-600" />
                Edit Maklumat Ahli
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-emerald-600" />
                Tambah Ahli Baru
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kemaskini maklumat ahli di bawah.'
              : 'Isi maklumat untuk mendaftar ahli baru.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-emerald-600" />
                Maklumat Peribadi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Penuh <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ahmad bin Abdullah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        No. Kad Pengenalan <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="901234-01-5678" maxLength={14} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        No. Telefon <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="01x-xxxxxxx" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mel</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@contoh.com"
                          type="email"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="No. 1, Jalan Utama, 12300 Butterworth, Pulau Pinang"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Category & Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Kategori &amp; Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_FORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_FORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Financial Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Maklumat Kewangan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="familyMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bilangan Ahli Keluarga</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendapatan Bulanan (RM)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={0.01} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan..."
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Simpan Perubahan' : 'Tambah Ahli'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ViewMemberDialog
// ---------------------------------------------------------------------------

// Inner content that auto-resets by mounting/unmounting with key
function ViewMemberDialogContent({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const isLoading = !member && !fetchError;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/members/${memberId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.data) {
          setMember(data.data);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          toast.error('Gagal memuat maklumat ahli');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const totalDonations =
    member?.donations?.reduce((sum, d) => sum + d.amount, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError || !member) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Gagal memuat maklumat ahli.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
          <UserCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {member.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            No. KP: {member.icNumber}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <CategoryBadge category={member.category} />
            <StatusBadge status={member.status} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Maklumat Hubungan</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{member.phone}</span>
          </div>
          {member.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-start gap-2 text-sm sm:col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{member.address}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Butiran Lanjut</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Tarikh Daftar</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {format(new Date(member.joinDate), 'dd/MM/yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ahli Keluarga</p>
            <p className="text-sm font-medium">{member.familyMembers} orang</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendapatan Bulanan</p>
            <p className="text-sm font-medium">{formatCurrency(member.monthlyIncome)}</p>
          </div>
        </div>
      </div>

      {member.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Catatan
            </h4>
            <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              {member.notes}
            </p>
          </div>
        </>
      )}

      {/* Related Donations */}
      {member.donations && member.donations.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Sejarah Sumbangan
              </span>
              <span className="text-xs font-normal text-emerald-600">
                Jumlah: {formatCurrency(totalDonations)}
              </span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {member.donations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-md border text-sm"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(d.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(d.date), 'dd/MM/yyyy')} &middot; {d.method}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Related Programme Memberships */}
      {member.programmeMembers && member.programmeMembers.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-emerald-600" />
              Penyertaan Program
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {member.programmeMembers.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-2.5 rounded-md border text-sm"
                >
                  <div>
                    <p className="font-medium">{pm.programme.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sebagai: {pm.role} &middot;{' '}
                      {format(new Date(pm.joinedAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <CategoryBadge category={pm.programme.category} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ViewMemberDialog({
  open,
  onOpenChange,
  memberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-600" />
            Maklumat Terperinci Ahli
          </DialogTitle>
          <DialogDescription>
            Butiran lengkap ahli dan rekod berkaitan.
          </DialogDescription>
        </DialogHeader>

        {open && memberId ? (
          <ViewMemberDialogContent key={memberId} memberId={memberId} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  open,
  onOpenChange,
  member,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!member) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memadam ahli');
      }

      toast.success('Ahli berjaya dipadam');
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ralat tidak diketahui');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Padam Ahli
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Adakah anda pasti ingin memadam ahli ini? Tindakan ini tidak boleh
                dibatalkan.
              </p>
              {member && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    No. KP: {member.icNumber}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Padam
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Mobile Card
// ---------------------------------------------------------------------------

function MemberMobileCard({
  member,
  onView,
  onEdit,
  onDelete,
}: {
  member: Member;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Name & IC */}
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-950 shrink-0">
            <UserCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
            <p className="text-xs text-muted-foreground">{member.icNumber}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <CategoryBadge category={member.category} />
          <StatusBadge status={member.status} />
        </div>

        {/* Contact */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{member.phone}</span>
          </div>
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
        </div>

        {/* Join Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Daftar: {format(new Date(member.joinDate), 'dd/MM/yyyy')}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" />
            Lihat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Padam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component: MembersTab
// ---------------------------------------------------------------------------

export default function MembersTab() {
  const isMobile = useIsMobile();

  // Data state
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/members?${params.toString()}`);
      const data: MembersResponse = await res.json();

      setMembers(data.data);
      setTotalMembers(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Gagal memuat senarai ahli');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  // Search debounce
  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Dialog handlers
  const handleAdd = () => {
    setSelectedMember(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormDialogOpen(true);
  };

  const handleView = (member: Member) => {
    setViewingMemberId(member.id);
    setViewDialogOpen(true);
  };

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleSaved = () => {
    fetchMembers();
  };

  const handleDeleted = () => {
    fetchMembers();
  };

  const hasFilters = !!(search || categoryFilter || statusFilter);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Header Section                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600" />
            Pengurusan Ahli
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Urus senarai ahli, maklumat peribadi, dan status keahlian.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="h-7 px-3 text-sm font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
          >
            <Users className="h-3.5 w-3.5" />
            {totalMembers} Ahli
          </Badge>
          <Button
            onClick={handleAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah Ahli
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filter / Search Bar                                               */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama atau No. KP..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search button (mobile) */}
            {isMobile && (
              <Button
                variant="outline"
                onClick={handleSearchSubmit}
                className="shrink-0"
              >
                <Search className="h-4 w-4" />
                Cari
              </Button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-muted-foreground mt-3">
              Menunjukkan {members.length} daripada {totalMembers} ahli
              {hasFilters && ' (ditapis)'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Members List                                                      */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        {loading ? (
          <CardContent className="p-4">
            {isMobile ? <MemberCardSkeleton /> : <MemberTableSkeleton />}
          </CardContent>
        ) : members.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : isMobile ? (
          /* Mobile: Card layout */
          <div className="divide-y">
            {members.map((m) => (
              <div key={m.id} className="p-3">
                <MemberMobileCard
                  member={m}
                  onView={() => handleView(m)}
                  onEdit={() => handleEdit(m)}
                  onDelete={() => handleDelete(m)}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: Table layout */
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. KP</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarikh Daftar</TableHead>
                  <TableHead className="text-right w-[120px]">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m, index) => (
                  <TableRow
                    key={m.id}
                    className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-full bg-emerald-100 p-1 dark:bg-emerald-950 shrink-0">
                          <UserCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[180px]">
                            {m.name}
                          </p>
                          {m.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {m.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.icNumber}</TableCell>
                    <TableCell className="text-sm">{m.phone}</TableCell>
                    <TableCell>
                      <CategoryBadge category={m.category} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.joinDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                          onClick={() => handleView(m)}
                          title="Lihat butiran"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => handleEdit(m)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(m)}
                          title="Padam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && members.length > 0 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Dialogs                                                           */}
      {/* ---------------------------------------------------------------- */}
      <MemberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        member={selectedMember}
        onSaved={handleSaved}
      />

      <ViewMemberDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        memberId={viewingMemberId}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        member={selectedMember}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
