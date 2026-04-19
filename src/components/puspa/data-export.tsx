'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types (must match the data shapes returned by the API)
// ---------------------------------------------------------------------------

export interface Member {
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
}

export interface Donation {
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

export interface Programme {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  beneficiaryCount: number;
  volunteerCount: number;
  budget: number;
  actualCost: number;
  partners: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/** Escape a cell value so it is safe inside a CSV field. */
function escapeCSV(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Format an ISO date string for Malay locale display. */
function formatDateCSV(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Trigger an in-browser CSV download. Includes UTF-8 BOM for Excel compatibility. */
function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

/**
 * Export members to CSV.
 * Columns: Nama, No.KP, Telefon, Emel, Alamat, Kategori, Status, Tarikh Daftar, Ahli Keluarga, Pendapatan Bulanan
 */
export function exportMembersCSV(members: Member[]): void {
  if (members.length === 0) {
    toast.error('Tiada data ahli untuk dieksport');
    return;
  }

  const headers = [
    'Nama',
    'No.KP',
    'Telefon',
    'Emel',
    'Alamat',
    'Kategori',
    'Status',
    'Tarikh Daftar',
    'Ahli Keluarga',
    'Pendapatan Bulanan',
  ];

  const rows = members.map((m) =>
    [
      escapeCSV(m.name),
      escapeCSV(m.icNumber),
      escapeCSV(m.phone),
      escapeCSV(m.email),
      escapeCSV(m.address),
      escapeCSV(m.category),
      escapeCSV(m.status),
      escapeCSV(formatDateCSV(m.joinDate)),
      escapeCSV(m.familyMembers),
      escapeCSV(m.monthlyIncome),
    ].join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCSV(csv, `ahli-puspa-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export donations to CSV.
 * Columns: Penderma, Emel, Telefon, Jumlah, Kaedah, Status, No.Resit, Tarikh, Program, Catatan
 */
export function exportDonationsCSV(donations: Donation[]): void {
  if (donations.length === 0) {
    toast.error('Tiada data sumbangan untuk dieksport');
    return;
  }

  const headers = [
    'Penderma',
    'Emel',
    'Telefon',
    'Jumlah',
    'Kaedah',
    'Status',
    'No.Resit',
    'Tarikh',
    'Program',
    'Catatan',
  ];

  const rows = donations.map((d) =>
    [
      escapeCSV(d.donorName),
      escapeCSV(d.donorEmail),
      escapeCSV(d.donorPhone),
      escapeCSV(d.amount),
      escapeCSV(d.method),
      escapeCSV(d.status),
      escapeCSV(d.receiptNumber),
      escapeCSV(formatDateCSV(d.date)),
      escapeCSV(d.programme?.name ?? ''),
      escapeCSV(d.notes),
    ].join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCSV(
    csv,
    `sumbangan-puspa-${new Date().toISOString().split('T')[0]}.csv`
  );
}

/**
 * Export programmes to CSV.
 * Columns: Nama, Kategori, Status, Tarikh Mula, Tarikh Akhir, Lokasi, Bil. Penerima, Bil. Sukarela, Bajet, Kos Sebenar
 */
export function exportProgrammesCSV(programmes: Programme[]): void {
  if (programmes.length === 0) {
    toast.error('Tiada data program untuk dieksport');
    return;
  }

  const headers = [
    'Nama',
    'Kategori',
    'Status',
    'Tarikh Mula',
    'Tarikh Akhir',
    'Lokasi',
    'Bil. Penerima',
    'Bil. Sukarela',
    'Bajet',
    'Kos Sebenar',
  ];

  const rows = programmes.map((p) =>
    [
      escapeCSV(p.name),
      escapeCSV(p.category),
      escapeCSV(p.status),
      escapeCSV(formatDateCSV(p.startDate)),
      escapeCSV(formatDateCSV(p.endDate)),
      escapeCSV(p.location),
      escapeCSV(p.beneficiaryCount),
      escapeCSV(p.volunteerCount),
      escapeCSV(p.budget),
      escapeCSV(p.actualCost),
    ].join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCSV(
    csv,
    `program-puspa-${new Date().toISOString().split('T')[0]}.csv`
  );
}

// ---------------------------------------------------------------------------
// ExportButton component
// ---------------------------------------------------------------------------

export function ExportButton({
  onExport,
  label = 'Eksport CSV',
  icon: Icon = Download,
}: {
  onExport: () => void;
  label?: string;
  icon?: LucideIcon;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      // Brief 1-second delay for visual feedback ("Menjana..." state)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onExport();
      toast.success('Data berjaya dieksport', {
        description: 'Fail CSV telah dimuat turun.',
      });
    } catch (err) {
      toast.error('Gagal mengeksport data', {
        description: err instanceof Error ? err.message : 'Sila cuba lagi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {isExporting ? 'Menjana...' : label}
    </Button>
  );
}
