'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  DollarSign,
  CalendarDays,
  Users,
  Building2,
  Sparkles,
  Copy,
  Printer,
  Download,
  RefreshCw,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────

type ReportType = 'summary' | 'financial' | 'programme' | 'member' | 'custom';

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  badgeText: string;
}

interface ReportHistoryItem {
  id: string;
  type: ReportType;
  title: string;
  report: string;
  createdAt: string;
}

// ─── Report Type Cards ──────────────────────────────────────────────────

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'summary',
    title: 'Ringkasan Organisasi',
    description: 'Gambaran menyeluruh organisasi termasuk ahli, program, sumbangan dan aktiviti',
    icon: Building2,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    badgeText: 'Overview',
  },
  {
    id: 'financial',
    title: 'Laporan Kewangan',
    description: 'Pecahan kewangan, sumbangan, bajet vs kos sebenar dan analisis bulanan',
    icon: DollarSign,
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    badgeText: 'Finance',
  },
  {
    id: 'programme',
    title: 'Laporan Program',
    description: 'Impak program, statistik penerima manfaat dan penglibatan sukarelawan',
    icon: CalendarDays,
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    badgeText: 'Programs',
  },
  {
    id: 'member',
    title: 'Demografi Ahli',
    description: 'Profil ahli, kategori, tahap pendapatan, lokasi dan trend pendaftaran',
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    badgeText: 'Members',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────

const HISTORY_KEY = 'puspa-report-history';
const MAX_HISTORY = 5;

function getHistory(): ReportHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(item: Omit<ReportHistoryItem, 'id' | 'createdAt'>) {
  const history = getHistory();
  const newItem: ReportHistoryItem = {
    ...item,
    id: `rpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

function deleteFromHistory(id: string) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

// ─── Loading Skeleton ───────────────────────────────────────────────────

function ReportLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Animated header */}
      <div className="flex items-center gap-3 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-6 h-6 text-purple-600" />
        </motion.div>
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          AI sedang menjana laporan...
        </span>
      </div>

      {/* Skeleton blocks */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// ─── Report Content with Markdown ───────────────────────────────────────

function ReportContent({ content }: { content: string }) {
  return (
    <div className="prose prose-purple dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function AIReportTab() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const generateReport = useCallback(async (type: ReportType, prompt?: string) => {
    setIsLoading(true);
    setReport(null);
    setReportTitle(null);
    setShowHistory(false);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, customPrompt: prompt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setReport(data.report);
      setReportTitle(data.title);

      // Save to history
      const updated = saveToHistory({ type, title: data.title, report: data.report });
      setHistory(updated);

      toast.success('Laporan berjaya dijana!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ralat tidak diketahui';
      toast.error(`Gagal menjana laporan: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCardClick = (type: ReportType) => {
    setSelectedType(type);
    setShowHistory(false);
    setReport(null);
    setReportTitle(null);
  };

  const handleGenerate = () => {
    if (selectedType === 'custom') {
      if (!customPrompt.trim()) {
        toast.error('Sila masukkan arahan untuk laporan khas.');
        return;
      }
      generateReport('custom', customPrompt.trim());
    } else if (selectedType) {
      generateReport(selectedType);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      toast.success('Laporan disalin ke papan keratan!');
    } catch {
      toast.error('Gagal menyalin laporan.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report || !reportTitle) return;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Laporan dimuat turun!');
  };

  const handleLoadHistory = (item: ReportHistoryItem) => {
    setReport(item.report);
    setReportTitle(item.title);
    setSelectedType(item.type);
    setShowHistory(false);
    toast.success('Laporan sejarah dimuatkan.');
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteFromHistory(id);
    setHistory(updated);
    toast.success('Laporan sejarah dipadam.');
  };

  const handleBack = () => {
    setReport(null);
    setReportTitle(null);
    setSelectedType(null);
    setShowHistory(false);
  };

  const typeLabel = REPORT_CARDS.find((c) => c.id === selectedType)?.title || 'Laporan Khas';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-200/40 dark:shadow-purple-900/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Penjana Laporan
            </h2>
            <p className="text-sm text-muted-foreground">
              Jana laporan profesional berdasarkan data semasa PUSPA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="border-gray-200 dark:border-gray-700"
          >
            <History className="w-4 h-4 mr-1.5" />
            Sejarah
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {history.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Report Type Selection ── */}
        {!selectedType && !report && !isLoading && !showHistory && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {REPORT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border ${card.borderColor} ${card.bgColor} group`}
                    onClick={() => handleCardClick(card.id)}
                  >
                    <CardHeader className="pb-3 pt-5 px-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.badgeColor} transition-transform group-hover:scale-110`}>
                          <Icon className={`h-5 w-5 ${card.textColor}`} />
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${card.badgeColor}`}>
                          {card.badgeText}
                        </Badge>
                      </div>
                      <CardTitle className={`text-base font-semibold ${card.textColor}`}>
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                      <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                        {card.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Custom Report Prompt */}
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-base text-purple-800 dark:text-purple-300">
                    Laporan Khas
                  </CardTitle>
                </div>
                <CardDescription>
                  Nyatakan arahan khas untuk laporan yang anda perlukan berdasarkan data PUSPA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Contoh: Sediakan laporan tentang trend sumbangan 6 bulan terakhir dengan cadangan strategi pengumpulan dana..."
                  rows={3}
                  className="border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {customPrompt.length} aksara
                  </span>
                  <Button
                    onClick={() => {
                      if (customPrompt.trim()) {
                        setSelectedType('custom');
                        generateReport('custom', customPrompt.trim());
                      } else {
                        toast.error('Sila masukkan arahan laporan khas.');
                      }
                    }}
                    disabled={!customPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Jana Laporan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── History Panel ── */}
        {showHistory && !isLoading && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-lg">Sejarah Laporan</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    Kembali
                  </Button>
                </div>
                <CardDescription>
                  {history.length > 0
                    ? `Menunjukkan ${history.length} laporan terkini`
                    : 'Tiada laporan sejarah'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada laporan yang dijana.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((item) => {
                      const card = REPORT_CARDS.find((c) => c.id === item.type);
                      const Icon = card?.icon || FileText;
                      const dateStr = new Date(item.createdAt).toLocaleDateString('ms-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleLoadHistory(item)}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Loading State ── */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardContent className="p-6 sm:p-8">
                <ReportLoadingSkeleton />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Report Display ── */}
        {report && !isLoading && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-200/40 dark:shadow-purple-900/30 shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100 truncate">
                        {reportTitle}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {typeLabel} • Dijana pada{' '}
                        {new Date().toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-gray-200 dark:border-gray-700 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Salin
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="border-gray-200 dark:border-gray-700 text-xs"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Cetak
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="border-gray-200 dark:border-gray-700 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Muat Turun
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="border-gray-200 dark:border-gray-700 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Baru
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <ReportContent content={report} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Generate Button for non-custom types ── */}
      {selectedType && selectedType !== 'custom' && !report && !isLoading && !showHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 pt-2"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-gray-200 dark:border-gray-700"
          >
            Kembali
          </Button>
          <Button
            onClick={handleGenerate}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Jana Laporan {typeLabel}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
