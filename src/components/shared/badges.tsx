import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draf", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  submitted: { label: "Hantaran", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  verifying: { label: "Verifikasi", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  verified: { label: "Disahkan", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  scoring: { label: "Penilaian", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  scored: { label: "Dinilai", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  approved: { label: "Diluluskan", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  disbursing: { label: "Pengagihan", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  disbursed: { label: "Diagihkan", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  follow_up: { label: "Susulan", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  closed: { label: "Ditutup", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  pending: { label: "Menunggu", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  confirmed: { label: "Sah", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  completed: { label: "Selesai", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  failed: { label: "Gagal", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  cancelled: { label: "Dibatalkan", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  active: { label: "Aktif", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  paused: { label: "Dijeda", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  processing: { label: "Memproses", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  urgent: { label: "Mendesak", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  high: { label: "Tinggi", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  low: { label: "Rendah", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="secondary" className={className}>{status}</Badge>;
  return (
    <Badge variant="secondary" className={cn("font-medium border-0", config.className, className)}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;
  return (
    <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded", config.className, className)}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG, PRIORITY_CONFIG };
