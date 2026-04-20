'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  MapPin,
  Users,
  HandHeart,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  DollarSign,
  Building2,
  PackageOpen,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Programme {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  startDate: string | null
  endDate: string | null
  location: string | null
  beneficiaryCount: number
  volunteerCount: number
  budget: number
  actualCost: number
  partners: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  donations?: Donation[]
  programmeMembers?: ProgrammeMember[]
}

interface Donation {
  id: string
  donorName: string
  amount: number
  method: string
  status: string
  date: string
  programmeId: string | null
}

interface ProgrammeMember {
  id: string
  role: string
  status: string
  joinedAt: string
  member: {
    id: string
    name: string
    category: string
  }
}

interface ProgrammesResponse {
  programmes: Programme[]
  total: number
  page: number
  limit: number
}

// ──────────────────────────────────────────────
// Constants & Mappings
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'food-aid', label: 'Bantuan Makanan' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'skills', label: 'Latihan Kemahiran' },
  { value: 'healthcare', label: 'Kesihatan' },
  { value: 'financial', label: 'Kewangan' },
  { value: 'community', label: 'Komuniti' },
] as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'food-aid': {
    label: 'Bantuan Makanan',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800',
  },
  education: {
    label: 'Pendidikan',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
  },
  skills: {
    label: 'Latihan Kemahiran',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
  },
  healthcare: {
    label: 'Kesihatan',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
  },
  financial: {
    label: 'Kewangan',
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800',
  },
  community: {
    label: 'Komuniti',
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-200 dark:border-cyan-800',
  },
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: {
    label: 'Aktif',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
  },
  completed: {
    label: 'Selesai',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
  },
  upcoming: {
    label: 'Akan Datang',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800',
  },
}

const EMPTY_FORM: Omit<Programme, 'id' | 'createdAt' | 'updatedAt' | 'donations' | 'programmeMembers'> = {
  name: '',
  description: '',
  category: 'food-aid',
  status: 'active',
  startDate: '',
  endDate: '',
  location: '',
  beneficiaryCount: 0,
  volunteerCount: 0,
  budget: 0,
  actualCost: 0,
  partners: '',
  notes: '',
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parsePartners(partnersStr: string | null): string[] {
  if (!partnersStr) return []
  try {
    const parsed = JSON.parse(partnersStr)
    if (Array.isArray(parsed)) return parsed.filter((p: unknown) => typeof p === 'string')
    return []
  } catch {
    // Fallback: treat as comma-separated
    return partnersStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORY_MAP[category]
  if (!cat) {
    return <Badge variant="outline">{category}</Badge>
  }
  return (
    <Badge variant="outline" className={cn(cat.bg, cat.color, 'border')}>
      {cat.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_MAP[status]
  if (!st) {
    return <Badge variant="outline">{status}</Badge>
  }
  return (
    <Badge variant="outline" className={cn(st.bg, st.color, 'border')}>
      {st.label}
    </Badge>
  )
}

function ProgrammeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <PackageOpen className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Tiada Program Dijumpai</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        Tiada program yang sepadan dengan carian atau penapis anda. Mulakan dengan menambah program baharu.
      </p>
      <Button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
        <Plus className="size-4" />
        Tambah Program
      </Button>
    </div>
  )
}

function ProgrammeCard({
  programme,
  onView,
  onEdit,
  onDelete,
}: {
  programme: Programme
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const partners = parsePartners(programme.partners)
  const budgetPercent =
    programme.budget > 0 ? Math.min(Math.round((programme.actualCost / programme.budget) * 100), 100) : 0
  const isOverBudget = programme.budget > 0 && programme.actualCost > programme.budget

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md py-0 gap-0">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-snug truncate">{programme.name}</CardTitle>
          </div>
          <StatusBadge status={programme.status} />
        </div>
        <div className="mt-1.5">
          <CategoryBadge category={programme.category} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4 px-5">
        {programme.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {programme.description}
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {programme.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{programme.location}</span>
            </div>
          )}
          {(programme.startDate || programme.endDate) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              <span className="truncate">
                {formatDate(programme.startDate)}
                {programme.endDate && programme.startDate ? ' — ' : ''}
                {programme.endDate ? formatDate(programme.endDate) : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>{programme.beneficiaryCount} penerima manfaat</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HandHeart className="size-3.5 shrink-0" />
            <span>{programme.volunteerCount} sukarelawan</span>
          </div>
        </div>

        {/* Budget progress */}
        {programme.budget > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="size-3" />
                Bajet
              </span>
              <span
                className={cn(
                  'font-medium',
                  isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                )}
              >
                {formatCurrency(programme.actualCost)} / {formatCurrency(programme.budget)}
              </span>
            </div>
            <Progress
              value={budgetPercent}
              className={cn('h-2', isOverBudget && '[&>[data-slot=progress-indicator]]:bg-rose-500')}
            />
          </div>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {partners.slice(0, 3).map((partner, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                <Building2 className="size-2.5" />
                {partner}
              </span>
            ))}
            {partners.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{partners.length - 3} lagi
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t px-5 py-3 gap-2">
        <Button variant="ghost" size="sm" onClick={onView} className="h-8 text-xs">
          <Eye className="size-3.5" />
          Lihat
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-xs">
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
        >
          <Trash2 className="size-3.5" />
          Padam
        </Button>
      </CardFooter>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Form Dialog
// ──────────────────────────────────────────────

interface ProgrammeFormData {
  name: string
  description: string
  category: string
  status: string
  startDate: string
  endDate: string
  location: string
  beneficiaryCount: number
  volunteerCount: number
  budget: number
  actualCost: number
  partners: string
  notes: string
}

function ProgrammeFormDialog({
  open,
  onClose,
  programme,
}: {
  open: boolean
  onClose: () => void
  programme: Programme | null
}) {
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof ProgrammeFormData, string>>>({})
  const isEditing = !!programme

  const [form, setForm] = React.useState<ProgrammeFormData>({
    name: '',
    description: '',
    category: 'food-aid',
    status: 'active',
    startDate: '',
    endDate: '',
    location: '',
    beneficiaryCount: 0,
    volunteerCount: 0,
    budget: 0,
    actualCost: 0,
    partners: '',
    notes: '',
  })

  // Reset form when dialog opens or programme changes
  React.useEffect(() => {
    if (open) {
      if (programme) {
        const partnersArr = parsePartners(programme.partners)
        setForm({
          name: programme.name,
          description: programme.description || '',
          category: programme.category,
          status: programme.status,
          startDate: programme.startDate ? format(new Date(programme.startDate), 'yyyy-MM-dd') : '',
          endDate: programme.endDate ? format(new Date(programme.endDate), 'yyyy-MM-dd') : '',
          location: programme.location || '',
          beneficiaryCount: programme.beneficiaryCount,
          volunteerCount: programme.volunteerCount,
          budget: programme.budget,
          actualCost: programme.actualCost,
          partners: partnersArr.join(', '),
          notes: programme.notes || '',
        })
      } else {
        setForm({ ...EMPTY_FORM })
      }
      setErrors({})
    }
  }, [open, programme])

  const updateField = <K extends keyof ProgrammeFormData>(key: K, value: ProgrammeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProgrammeFormData, string>> = {}
    if (!form.name.trim()) newErrors.name = 'Nama program diperlukan'
    if (!form.category) newErrors.category = 'Kategori diperlukan'
    if (!form.status) newErrors.status = 'Status diperlukan'
    if (form.beneficiaryCount < 0) newErrors.beneficiaryCount = 'Jumlah tidak boleh negatif'
    if (form.volunteerCount < 0) newErrors.volunteerCount = 'Jumlah tidak boleh negatif'
    if (form.budget < 0) newErrors.budget = 'Bajet tidak boleh negatif'
    if (form.actualCost < 0) newErrors.actualCost = 'Kos sebenar tidak boleh negatif'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const partnersArr = form.partners
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const body = {
        ...form,
        partners: partnersArr.length > 0 ? JSON.stringify(partnersArr) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }

      const url = isEditing ? `/api/programmes/${programme!.id}` : '/api/programmes'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Gagal ${isEditing ? 'mengemaskini' : 'menambah'} program`)
      }

      toast.success(isEditing ? 'Program berjaya dikemaskini' : 'Program baharu berjaya ditambah')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sesuatu berlaku salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Program' : 'Tambah Program Baharu'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kemaskini butiran program yang sedia ada.'
              : 'Isikan maklumat untuk menambah program baharu.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="flex-1 -mx-6 px-6 max-h-[calc(90vh-12rem)]">
            <div className="grid gap-5 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="prog-name">
                  Nama Program <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="prog-name"
                  placeholder="Contoh: Program Makanan Ringan Komuniti"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  className={cn(errors.name && 'border-rose-300 focus-visible:ring-rose-300')}
                />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="prog-desc">Penerangan</Label>
                <Textarea
                  id="prog-desc"
                  placeholder="Terangkan tujuan dan objektif program ini..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Kategori <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateField('category', v)}
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.filter((c) => c.value !== 'all').map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-rose-500">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>
                    Status <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.status}>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-xs text-rose-500">{errors.status}</p>}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prog-start">Tarikh Mula</Label>
                  <Input
                    id="prog-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-end">Tarikh Tamat</Label>
                  <Input
                    id="prog-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="prog-location">Lokasi</Label>
                <Input
                  id="prog-location"
                  placeholder="Contoh: Masjid Al-Ihsan, Petaling Jaya"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prog-beneficiaries">Jumlah Penerima Manfaat</Label>
                  <Input
                    id="prog-beneficiaries"
                    type="number"
                    min={0}
                    value={form.beneficiaryCount}
                    onChange={(e) => updateField('beneficiaryCount', parseInt(e.target.value) || 0)}
                    aria-invalid={!!errors.beneficiaryCount}
                    className={cn(errors.beneficiaryCount && 'border-rose-300 focus-visible:ring-rose-300')}
                  />
                  {errors.beneficiaryCount && (
                    <p className="text-xs text-rose-500">{errors.beneficiaryCount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-volunteers">Jumlah Sukarelawan</Label>
                  <Input
                    id="prog-volunteers"
                    type="number"
                    min={0}
                    value={form.volunteerCount}
                    onChange={(e) => updateField('volunteerCount', parseInt(e.target.value) || 0)}
                    aria-invalid={!!errors.volunteerCount}
                    className={cn(errors.volunteerCount && 'border-rose-300 focus-visible:ring-rose-300')}
                  />
                  {errors.volunteerCount && (
                    <p className="text-xs text-rose-500">{errors.volunteerCount}</p>
                  )}
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prog-budget">Bajet (RM)</Label>
                  <Input
                    id="prog-budget"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.budget}
                    onChange={(e) => updateField('budget', parseFloat(e.target.value) || 0)}
                    aria-invalid={!!errors.budget}
                    className={cn(errors.budget && 'border-rose-300 focus-visible:ring-rose-300')}
                  />
                  {errors.budget && <p className="text-xs text-rose-500">{errors.budget}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-actual">Kos Sebenar (RM)</Label>
                  <Input
                    id="prog-actual"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.actualCost}
                    onChange={(e) => updateField('actualCost', parseFloat(e.target.value) || 0)}
                    aria-invalid={!!errors.actualCost}
                    className={cn(errors.actualCost && 'border-rose-300 focus-visible:ring-rose-300')}
                  />
                  {errors.actualCost && <p className="text-xs text-rose-500">{errors.actualCost}</p>}
                </div>
              </div>

              {/* Partners */}
              <div className="space-y-2">
                <Label htmlFor="prog-partners">Rakan Kongsi</Label>
                <Input
                  id="prog-partners"
                  placeholder="Pisahkan dengan koma. Contoh: Yayasan A, Syarikat B"
                  value={form.partners}
                  onChange={(e) => updateField('partners', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Masukkan nama rakan kongsi dipisahkan dengan koma.</p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="prog-notes">Catatan</Label>
                <Textarea
                  id="prog-notes"
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? 'Menyimpan...' : 'Menambah...'}
                </span>
              ) : isEditing ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Program'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// View Details Dialog
// ──────────────────────────────────────────────

function ViewProgrammeDialog({
  open,
  onClose,
  programme,
}: {
  open: boolean
  onClose: () => void
  programme: Programme | null
}) {
  const [loading, setLoading] = React.useState(false)
  const [details, setDetails] = React.useState<Programme | null>(null)

  React.useEffect(() => {
    if (open && programme) {
      fetchDetails(programme.id)
    }
    if (!open) {
      setDetails(null)
    }
  }, [open, programme])

  const fetchDetails = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/programmes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDetails(data)
      }
    } catch {
      // fallback to passed programme
      setDetails(programme)
    } finally {
      setLoading(false)
    }
  }

  const p = details || programme
  if (!p) return null

  const partners = parsePartners(p.partners)
  const budgetPercent =
    p.budget > 0 ? Math.min(Math.round((p.actualCost / p.budget) * 100), 100) : 0
  const isOverBudget = p.budget > 0 && p.actualCost > p.budget
  const donations = (p as Programme & { donations?: Donation[] }).donations || []
  const members = (p as Programme & { programmeMembers?: ProgrammeMember[] }).programmeMembers || []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-lg">{p.name}</DialogTitle>
            <CategoryBadge category={p.category} />
            <StatusBadge status={p.status} />
          </div>
          <DialogDescription className="mt-1">
            Dicipta pada {format(new Date(p.createdAt), 'dd MMM yyyy, HH:mm')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="py-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Description */}
              {p.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-1.5">Penerangan</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {p.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {p.location && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Lokasi</span>
                      <span>{p.location}</span>
                    </div>
                  </div>
                )}
                {(p.startDate || p.endDate) && (
                  <div className="flex items-start gap-2 text-sm">
                    <CalendarDays className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Tempoh</span>
                      <span>
                        {formatDate(p.startDate)}
                        {(p.startDate || p.endDate) ? ' — ' : ''}
                        {formatDate(p.endDate)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-xs block">Penerima Manfaat</span>
                    <span>{p.beneficiaryCount} orang</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <HandHeart className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-xs block">Sukarelawan</span>
                    <span>{p.volunteerCount} orang</span>
                  </div>
                </div>
              </div>

              {/* Budget */}
              {p.budget > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Kewangan</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bajet</span>
                        <span className="font-medium">{formatCurrency(p.budget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kos Sebenar</span>
                        <span
                          className={cn(
                            'font-medium',
                            isOverBudget
                              ? 'text-rose-600 dark:text-rose-400'
                              : ''
                          )}
                        >
                          {formatCurrency(p.actualCost)}
                          {isOverBudget && ' (Melebihi bajet!)'}
                        </span>
                      </div>
                      <Progress
                        value={budgetPercent}
                        className={cn(
                          'h-2.5',
                          isOverBudget && '[&>[data-slot=progress-indicator]]:bg-rose-500'
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {budgetPercent}% bajet digunakan
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Partners */}
              {partners.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Rakan Kongsi</h4>
                    <div className="flex flex-wrap gap-2">
                      {partners.map((partner, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="flex items-center gap-1.5"
                        >
                          <Building2 className="size-3" />
                          {partner}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {p.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-1.5">Catatan</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.notes}</p>
                  </div>
                </>
              )}

              {/* Related Donations */}
              {donations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Sumbangan Berkaitan ({donations.length})
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                                Penderma
                              </th>
                              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                                Jumlah
                              </th>
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                                Kaedah
                              </th>
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {donations.slice(0, 5).map((d) => (
                              <tr key={d.id} className="border-t">
                                <td className="px-3 py-2">{d.donorName}</td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {formatCurrency(d.amount)}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell capitalize">
                                  {d.method.replace(/-/g, ' ')}
                                </td>
                                <td className="px-3 py-2 hidden md:table-cell">
                                  <StatusBadge status={d.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {donations.length > 5 && (
                        <p className="text-xs text-muted-foreground px-3 py-2 border-t bg-muted/30">
                          +{donations.length - 5} sumbangan lagi
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Related Members */}
              {members.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Ahli Berkaitan ({members.length})
                    </h4>
                    <div className="space-y-2">
                      {members.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Users className="size-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{m.member?.name || '-'}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {m.role} · {m.member?.category || '-'}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                      ))}
                      {members.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{members.length - 5} ahli lagi
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Delete Confirmation
// ──────────────────────────────────────────────

function DeleteProgrammeDialog({
  open,
  onClose,
  programme,
}: {
  open: boolean
  onClose: () => void
  programme: Programme | null
}) {
  const [loading, setLoading] = React.useState(false)

  const handleDelete = async () => {
    if (!programme) return
    setLoading(true)
    try {
      const res = await fetch(`/api/programmes/${programme.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memadam program')
      }
      toast.success('Program berjaya dipadam')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sesuatu berlaku salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Padam Program</AlertDialogTitle>
          <AlertDialogDescription>
            Adakah anda pasti ingin memadam program &ldquo;{programme?.name}&rdquo;? Tindakan ini tidak
            boleh dibatalkan dan semua data berkaitan akan dipadam secara kekal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-300"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memadam...
              </span>
            ) : (
              'Padam'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ──────────────────────────────────────────────
// Main ProgrammesTab Component
// ──────────────────────────────────────────────

export default function ProgrammesTab() {
  // Data & loading state
  const [programmes, setProgrammes] = React.useState<Programme[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  // Dialog state
  const [formOpen, setFormOpen] = React.useState(false)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [selectedProgramme, setSelectedProgramme] = React.useState<Programme | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch programmes
  const fetchProgrammes = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', '1')
      params.set('limit', '50')

      const res = await fetch(`/api/programmes?${params.toString()}`)
      if (res.ok) {
        const data: ProgrammesResponse = await res.json()
        setProgrammes(data.programmes)
        setTotal(data.total)
      } else {
        toast.error('Gagal memuatkan program')
      }
    } catch {
      toast.error('Sesuatu berlaku salah')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryFilter, statusFilter])

  React.useEffect(() => {
    fetchProgrammes()
  }, [fetchProgrammes])

  // Handlers
  const handleAdd = () => {
    setSelectedProgramme(null)
    setFormOpen(true)
  }

  const handleEdit = (programme: Programme) => {
    setSelectedProgramme(programme)
    setFormOpen(true)
  }

  const handleView = (programme: Programme) => {
    setSelectedProgramme(programme)
    setViewOpen(true)
  }

  const handleDelete = (programme: Programme) => {
    setSelectedProgramme(programme)
    setDeleteOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedProgramme(null)
    fetchProgrammes()
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setSelectedProgramme(null)
    fetchProgrammes()
  }

  const handleViewClose = () => {
    setViewOpen(false)
    setSelectedProgramme(null)
  }

  // Derived
  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <section className="space-y-6" aria-label="Pengurusan Program">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pengurusan Program</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Urus dan pantau semua program PUSPA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {loading ? '...' : `${total} program`}
          </Badge>
          <Button
            onClick={handleAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus className="size-4" />
            Tambah Program
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
              setStatusFilter('all')
            }}
            className="text-xs shrink-0"
          >
            <X className="size-3.5" />
            Set Semula
          </Button>
        )}
      </div>

      {/* Programme Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProgrammeCardSkeleton key={i} />
          ))}
        </div>
      ) : programmes.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {programmes.map((prog) => (
              <ProgrammeCard
                key={prog.id}
                programme={prog}
                onView={() => handleView(prog)}
                onEdit={() => handleEdit(prog)}
                onDelete={() => handleDelete(prog)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Menunjukkan {programmes.length} daripada {total} program
          </p>
        </>
      )}

      {/* Dialogs */}
      <ProgrammeFormDialog
        open={formOpen}
        onClose={handleFormClose}
        programme={selectedProgramme}
      />

      <ViewProgrammeDialog
        open={viewOpen}
        onClose={handleViewClose}
        programme={selectedProgramme}
      />

      <DeleteProgrammeDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        programme={selectedProgramme}
      />
    </section>
  )
}
