'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Eye,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string | null;
  date: string;
  programmeId: string | null;
  memberId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  programme?: { id: string; name: string } | null;
}

interface Programme {
  id: string;
  name: string;
}

interface DonationsSummary {
  totalDonations: number;
  thisMonthDonations: number;
  totalDonors: number;
}

interface DonationsResponse {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
  summary: DonationsSummary;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: 'Disahkan',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  pending: {
    label: 'Menunggu',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  rejected: {
    label: 'Ditolak',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
};

const METHOD_MAP: Record<string, string> = {
  'bank-transfer': 'Transfer Bank',
  cash: 'Tunai',
  online: 'Dalam Talian',
  cheque: 'Cek',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'confirmed', label: 'Disahkan' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'rejected', label: 'Ditolak' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'bank-transfer', label: 'Transfer Bank' },
  { value: 'cash', label: 'Tunai' },
  { value: 'online', label: 'Dalam Talian' },
  { value: 'cheque', label: 'Cek' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const donationFormSchema = z.object({
  donorName: z.string().min(1, 'Nama penderma diperlukan'),
  donorEmail: z
    .string()
    .email('Emel tidak sah')
    .nullable()
    .or(z.literal('')),
  donorPhone: z.string().nullable().or(z.literal('')),
  amount: z.coerce.number().positive('Jumlah mesti lebih daripada 0'),
  method: z.string().min(1, 'Kaedah diperlukan'),
  status: z.string().min(1, 'Status diperlukan'),
  receiptNumber: z.string().nullable().or(z.literal('')),
  date: z.string().min(1, 'Tarikh diperlukan'),
  programmeId: z.string().nullable().or(z.literal('')),
  notes: z.string().nullable().or(z.literal('')),
});

type DonationFormValues = z.infer<typeof donationFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  const config = STATUS_MAP[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

function getMethodLabel(method: string): string {
  return METHOD_MAP[method] || method;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: DonationsSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Donations */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="size-4 text-emerald-600" />
            Jumlah Sumbangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(summary.totalDonations)}
          </p>
        </CardContent>
      </Card>

      {/* This Month Donations */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarDays className="size-4 text-amber-600" />
            Sumbangan Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {formatCurrency(summary.thisMonthDonations)}
          </p>
        </CardContent>
      </Card>

      {/* Total Donors */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="size-4 text-blue-600" />
            Jumlah Penderma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {summary.totalDonors.toLocaleString('ms-MY')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  method,
  onMethodChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Cari nama penderma..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => onSearchChange('')}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
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

      {/* Method Filter */}
      <Select value={method} onValueChange={onMethodChange}>
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Kaedah" />
        </SelectTrigger>
        <SelectContent>
          {METHOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DonationsTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function DonationFormDialog({
  open,
  onOpenChange,
  editingDonation,
  programmes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDonation: Donation | null;
  programmes: Programme[];
  onSaved: () => void;
}) {
  const isEditing = !!editingDonation;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      amount: 0,
      method: 'cash',
      status: 'pending',
      receiptNumber: '',
      date: new Date().toISOString().split('T')[0],
      programmeId: '',
      notes: '',
    },
  });

  // Reset form when editing donation changes
  useEffect(() => {
    if (open) {
      if (editingDonation) {
        form.reset({
          donorName: editingDonation.donorName,
          donorEmail: editingDonation.donorEmail || '',
          donorPhone: editingDonation.donorPhone || '',
          amount: editingDonation.amount,
          method: editingDonation.method,
          status: editingDonation.status,
          receiptNumber: editingDonation.receiptNumber || '',
          date: editingDonation.date
            ? new Date(editingDonation.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          programmeId: editingDonation.programmeId || '',
          notes: editingDonation.notes || '',
        });
      } else {
        form.reset({
          donorName: '',
          donorEmail: '',
          donorPhone: '',
          amount: 0,
          method: 'cash',
          status: 'pending',
          receiptNumber: '',
          date: new Date().toISOString().split('T')[0],
          programmeId: '',
          notes: '',
        });
      }
    }
  }, [open, editingDonation, form]);

  const onSubmit = async (values: DonationFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        donorEmail: values.donorEmail || null,
        donorPhone: values.donorPhone || null,
        receiptNumber: values.receiptNumber || null,
        programmeId: values.programmeId || null,
        notes: values.notes || null,
      };

      const url = isEditing
        ? `/api/donations/${editingDonation.id}`
        : '/api/donations';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal ${isEditing ? 'mengemaskini' : 'menambah'} sumbangan`);
      }

      toast.success(
        isEditing
          ? 'Sumbangan berjaya dikemaskini'
          : 'Sumbangan berjaya ditambah'
      );
      onOpenChange(false);
      onSaved();
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
          <DialogTitle>
            {isEditing ? 'Kemaskini Sumbangan' : 'Tambah Sumbangan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kemaskini maklumat sumbangan di bawah.'
              : 'Isi maklumat sumbangan baru.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Donor Info Section */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Maklumat Penderma</h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Donor Name */}
              <FormField
                control={form.control}
                name="donorName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      Nama Penderma <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nama penderma"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Donor Email */}
              <FormField
                control={form.control}
                name="donorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emel Penderma</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          type="email"
                          placeholder="penderma@contoh.com"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Donor Phone */}
              <FormField
                control={form.control}
                name="donorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Telefon Penderma</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          placeholder="01x-xxxxxxx"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Donation Details Section */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold">Butiran Sumbangan</h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Jumlah (RM) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          className="pl-9"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? 0 : parseFloat(e.target.value)
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Method */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kaedah <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih kaedah" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank-transfer">
                          Transfer Bank
                        </SelectItem>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="online">Dalam Talian</SelectItem>
                        <SelectItem value="cheque">Cek</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
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
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="confirmed">Disahkan</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tarikh <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarDays className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt Number */}
              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Resit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          placeholder="Masukkan no. resit"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Programme */}
              <FormField
                control={form.control}
                name="programmeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(val) =>
                        field.onChange(val === '__none__' ? '' : val)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih program (pilihan)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Tiada Program
                        </SelectItem>
                        {programmes.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id}>
                            {prog.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan (pilihan)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : isEditing ? (
                  'Kemaskini'
                ) : (
                  'Tambah Sumbangan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ViewDonationDialog({
  open,
  onOpenChange,
  donation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: Donation | null;
}) {
  if (!donation) return null;

  const detailItems = [
    {
      label: 'Nama Penderma',
      value: donation.donorName,
      icon: Users,
    },
    {
      label: 'Emel',
      value: donation.donorEmail || '-',
      icon: Mail,
    },
    {
      label: 'No. Telefon',
      value: donation.donorPhone || '-',
      icon: Phone,
    },
    {
      label: 'Jumlah',
      value: formatCurrency(donation.amount),
      icon: DollarSign,
      highlight: true,
    },
    {
      label: 'Kaedah',
      value: getMethodLabel(donation.method),
      icon: Banknote,
    },
    {
      label: 'Status',
      value: STATUS_MAP[donation.status]?.label || donation.status,
      icon: FileText,
      badge: donation.status,
    },
    {
      label: 'No. Resit',
      value: donation.receiptNumber || '-',
      icon: Download,
    },
    {
      label: 'Tarikh',
      value: formatDate(donation.date),
      icon: CalendarDays,
    },
    {
      label: 'Program',
      value: donation.programme?.name || '-',
      icon: FileText,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Butiran Sumbangan
          </DialogTitle>
          <DialogDescription>
            Maklumat lengkap sumbangan daripada {donation.donorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <item.icon className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">{item.label}</p>
                {item.badge ? (
                  <div className="mt-0.5">
                    {getStatusBadge(item.badge)}
                  </div>
                ) : (
                  <p
                    className={cn(
                      'text-sm font-medium',
                      item.highlight &&
                        'text-lg font-bold text-emerald-700 dark:text-emerald-400'
                    )}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          ))}

          {donation.notes && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <FileText className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">Catatan</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">
                  {donation.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          Dicipta: {formatDate(donation.createdAt)} · Dikemaskini:{' '}
          {formatDate(donation.updatedAt)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDonationDialog({
  open,
  onOpenChange,
  donation,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: Donation | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!donation) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Padam Sumbangan</AlertDialogTitle>
          <AlertDialogDescription>
            Adakah anda pasti ingin memadam sumbangan{' '}
            <span className="font-semibold">{donation.donorName}</span> sebanyak{' '}
            <span className="font-semibold">
              {formatCurrency(donation.amount)}
            </span>
            ? Tindakan ini tidak boleh dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memadam...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="size-4" />
                Padam
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <Banknote className="text-muted-foreground size-8" />
      </div>
      <div>
        <p className="font-medium">Tiada sumbangan ditemui</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {hasFilters
            ? 'Cuba ubah penapis carian anda.'
            : 'Mula tambah sumbangan pertama anda.'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DonationsTab() {
  // Data state
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationsSummary>({
    totalDonations: 0,
    thisMonthDonations: 0,
    totalDonors: 0,
  });
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [total, setTotal] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deletingDonation, setDeletingDonation] = useState<Donation | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasFilters = search || statusFilter !== 'all' || methodFilter !== 'all';
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Fetch programmes
  const fetchProgrammes = useCallback(async () => {
    try {
      const res = await fetch('/api/programmes?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProgrammes(
          (data.programmes || []).map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          }))
        );
      }
    } catch {
      // Silently fail - programmes list is optional for donation form
    }
  }, []);

  // Fetch donations
  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/donations?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuatkan sumbangan');

      const data: DonationsResponse = await res.json();
      setDonations(data.donations || []);
      setTotal(data.total || 0);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memuatkan data sumbangan'
      );
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [search, statusFilter, methodFilter, page]);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, methodFilter]);

  // Handlers
  const handleAddNew = () => {
    setEditingDonation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setIsFormOpen(true);
  };

  const handleView = (donation: Donation) => {
    setViewingDonation(donation);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (donation: Donation) => {
    setDeletingDonation(donation);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDonation) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/donations/${deletingDonation.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memadam sumbangan');
      }
      toast.success('Sumbangan berjaya dipadam');
      setIsDeleteOpen(false);
      setDeletingDonation(null);
      fetchDonations();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memadam sumbangan'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSaved = () => {
    fetchDonations();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const pageRange = useMemo(() => {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return total > 0 ? `${start}–${end} daripada ${total}` : '0';
  }, [page, total, limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Pengurusan Sumbangan</h2>
          <p className="text-muted-foreground text-sm">
            Urus dan jejak semua rekod sumbangan PUSPA
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="size-4" />
          Tambah Sumbangan
        </Button>
      </div>

      {/* Summary Cards */}
      {isInitialLoading ? (
        <SummaryCardsSkeleton />
      ) : (
        <SummaryCards summary={summary} />
      )}

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        method={methodFilter}
        onMethodChange={setMethodFilter}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <DonationsTableSkeleton />
          ) : donations.length === 0 ? (
            <EmptyState hasFilters={!!hasFilters} />
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Nama Penderma</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Kaedah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="w-16 text-center">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation, idx) => (
                    <TableRow key={donation.id}>
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {donation.donorName}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(donation.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {getMethodLabel(donation.method)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(donation.date)}
                      </TableCell>
                      <TableCell>
                        {donation.programme?.name ? (
                          <Badge variant="secondary" className="font-normal">
                            {donation.programme.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Tindakan</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleView(donation)}
                              className="gap-2"
                            >
                              <Eye className="size-4" />
                              Lihat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(donation)}
                              className="gap-2"
                            >
                              <Pencil className="size-4" />
                              Kemaskini
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(donation)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              Padam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {total > 0 && (
          <div className="border-t flex items-center justify-between px-4 py-3">
            <p className="text-muted-foreground text-sm">{pageRange}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Halaman sebelumnya</span>
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                )
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="text-muted-foreground px-1 text-sm"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? 'default' : 'outline'}
                      size="icon"
                      className="size-8"
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Halaman seterusnya</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <DonationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingDonation={editingDonation}
        programmes={programmes}
        onSaved={handleFormSaved}
      />

      <ViewDonationDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        donation={viewingDonation}
      />

      <DeleteDonationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        donation={deletingDonation}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
