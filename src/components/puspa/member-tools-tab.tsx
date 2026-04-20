'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Wrench,
  Search,
  Brain,
  Calculator,
  ClipboardCheck,
  MessageSquare,
  Phone,
  Home,
  GraduationCap,
  HeartPulse,
  Wallet,
  Building,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronRight,
  Calendar,
  User,
  Mail,
  MapPin,
  Users,
  FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  category: string;
  status: string;
  monthlyIncome: number;
  familyMembers: number;
  address?: string;
  phone: string;
  email?: string;
}

interface EligibleProgramme {
  programmeId: string;
  programmeName: string;
  matchScore: number;
  reason: string;
}

interface AidResult {
  recommendedMonthlyAid: number;
  breakdown: {
    garisKemiskinan: number;
    pendapatanBulanan: number;
    jurangPendapatan: number;
    pendarabanKeluarga: number;
    kategoriAhli: string;
    pelarasanKategori: string;
    keperluanKhas: string;
    tambahanKeperluanKhas: number;
    labelKeperluanKhas: string;
  };
  category: {
    category: string;
    label: string;
    color: string;
  };
}

interface WelfareAssessment {
  id: string;
  foodSecurity: number;
  education: number;
  healthcare: number;
  financial: number;
  housing: number;
  overallScore: number;
  notes?: string;
  assessedBy?: string;
  assessedAt: string;
  createdAt: string;
}

interface CommunicationLog {
  id: string;
  type: string;
  summary: string;
  followUpNeeded: boolean;
  followUpDate?: string;
  priority: string;
  conductedBy?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  asnaf: 'Asnaf',
  volunteer: 'Sukarelawan',
  donor: 'Penderma',
  staff: 'Kakitangan',
};

const commTypeLabels: Record<string, string> = {
  phone: 'Telefon',
  visit: 'Lawatan',
  meeting: 'Mesyuarat',
  email: 'E-mel',
  'aid-distribution': 'Agihan Bantuan',
};

const commTypeIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="w-4 h-4" />,
  visit: <Home className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  'aid-distribution': <HeartPulse className="w-4 h-4" />,
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Rendah', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'Tinggi', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Mendesak', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function getScoreColor(score: number): string {
  if (score < 2.5) return 'text-red-600 dark:text-red-400';
  if (score < 3.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getScoreBg(score: number): string {
  if (score < 2.5) return 'bg-red-100 dark:bg-red-900/30';
  if (score < 3.5) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-emerald-100 dark:bg-emerald-900/30';
}

function getScoreLabel(score: number): string {
  if (score < 2.0) return 'Kritikal';
  if (score < 2.5) return 'Perlu Perhatian';
  if (score < 3.5) return 'Sederhana';
  if (score < 4.5) return 'Baik';
  return 'Sangat Baik';
}

function getMatchColor(score: number): string {
  if (score >= 80) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
  if (score >= 60) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
}

function getMatchBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Welfare slider labels ───────────────────────────────────────────────

const welfareDimensions = [
  { key: 'foodSecurity', label: 'Keselamatan Makanan', icon: <HeartPulse className="w-4 h-4" /> },
  { key: 'education', label: 'Pendidikan', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'healthcare', label: 'Kesihatan', icon: <HeartPulse className="w-4 h-4" /> },
  { key: 'financial', label: 'Kewangan', icon: <Wallet className="w-4 h-4" /> },
  { key: 'housing', label: 'Perumahan', icon: <Building className="w-4 h-4" /> },
] as const;

// ─── Component ────────────────────────────────────────────────────────────

export default function MemberToolsTab() {
  // Member selector state
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);

  // Eligibility state
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: EligibleProgramme[];
    summary: string;
  } | null>(null);

  // Aid calculator state
  const [aidIncome, setAidIncome] = useState('');
  const [aidFamilySize, setAidFamilySize] = useState('4');
  const [aidCategory, setAidCategory] = useState('asnaf');
  const [aidSpecialNeeds, setAidSpecialNeeds] = useState('');
  const [aidLoading, setAidLoading] = useState(false);
  const [aidResult, setAidResult] = useState<AidResult | null>(null);

  // Welfare state
  const [welfareScores, setWelfareScores] = useState({
    foodSecurity: 3,
    education: 3,
    healthcare: 3,
    financial: 3,
    housing: 3,
  });
  const [welfareNotes, setWelfareNotes] = useState('');
  const [welfareLoading, setWelfareLoading] = useState(false);
  const [welfareHistory, setWelfareHistory] = useState<WelfareAssessment[]>([]);
  const [welfareLoadingHistory, setWelfareLoadingHistory] = useState(false);

  // Communication state
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'phone',
    summary: '',
    followUpNeeded: false,
    followUpDate: '',
    priority: 'normal',
    conductedBy: '',
  });
  const [commSubmitting, setCommSubmitting] = useState(false);

  // ─── Fetch members ────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        const memberList = Array.isArray(data) ? data : data.members || data.data || [];
        setMembers(memberList);
      }
    } catch {
      toast.error('Gagal memuatkan senarai ahli.');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ─── Handle member selection ──────────────────────────────────────────

  const handleMemberSelect = useCallback(
    async (memberId: string) => {
      setSelectedMemberId(memberId);
      setSelectedMember(null);
      setEligibilityResult(null);
      setAidResult(null);

      if (memberId) {
        const member = members.find((m) => m.id === memberId);
        if (member) {
          setSelectedMember(member);
          setAidIncome(member.monthlyIncome.toString());
          setAidFamilySize(member.familyMembers.toString());
          setAidCategory(member.category);

          // Fetch welfare history
          setWelfareLoadingHistory(true);
          try {
            const res = await fetch(`/api/members/tools/welfare/${memberId}`);
            if (res.ok) {
              const data = await res.json();
              setWelfareHistory(data.history || []);

              if (data.latest) {
                setWelfareScores({
                  foodSecurity: data.latest.foodSecurity,
                  education: data.latest.education,
                  healthcare: data.latest.healthcare,
                  financial: data.latest.financial,
                  housing: data.latest.housing,
                });
                setWelfareNotes(data.latest.notes || '');
              }
            }
          } catch {
            toast.error('Gagal memuatkan penilaian kebajikan.');
          } finally {
            setWelfareLoadingHistory(false);
          }

          // Fetch communication logs
          setCommLoading(true);
          try {
            const res = await fetch(`/api/members/tools/communication/${memberId}`);
            if (res.ok) {
              const data = await res.json();
              setCommLogs(Array.isArray(data) ? data : []);
            }
          } catch {
            toast.error('Gagal memuatkan rekod komunikasi.');
          } finally {
            setCommLoading(false);
          }
        }
      }
    },
    [members]
  );

  // ─── Eligibility check ────────────────────────────────────────────────

  const handleEligibilityCheck = async () => {
    if (!selectedMemberId) return;
    setEligibilityLoading(true);
    setEligibilityResult(null);

    try {
      const res = await fetch('/api/members/tools/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedMemberId }),
      });

      if (res.ok) {
        const data = await res.json();
        setEligibilityResult(data);
        if (data.eligible && data.eligible.length === 0) {
          toast.info('Tiada program baru yang layak untuk ahli ini.');
        } else {
          toast.success('Semakan kelayakan selesai!');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menjalankan semakan kelayakan.');
      }
    } catch {
      toast.error('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  // ─── Aid calculator ───────────────────────────────────────────────────

  const handleAidCalculate = async () => {
    const income = parseFloat(aidIncome);
    const familySize = parseInt(aidFamilySize);

    if (isNaN(income) || income < 0) {
      toast.error('Sila masukkan pendapatan bulanan yang sah.');
      return;
    }

    if (isNaN(familySize) || familySize < 1) {
      toast.error('Sila masukkan saiz keluarga yang sah.');
      return;
    }

    setAidLoading(true);
    setAidResult(null);

    try {
      const res = await fetch('/api/members/tools/aid-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: income,
          familySize,
          category: aidCategory,
          specialNeeds: aidSpecialNeeds || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAidResult(data);
        toast.success('Pengiraan bantuan selesai!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengira bantuan.');
      }
    } catch {
      toast.error('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setAidLoading(false);
    }
  };

  // ─── Welfare assessment save ──────────────────────────────────────────

  const handleWelfareSave = async () => {
    if (!selectedMemberId) return;
    setWelfareLoading(true);

    try {
      const res = await fetch('/api/members/tools/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          ...welfareScores,
          notes: welfareNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWelfareHistory((prev) => [data, ...prev]);
        toast.success('Penilaian kebajikan berjaya disimpan!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan penilaian.');
      }
    } catch {
      toast.error('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setWelfareLoading(false);
    }
  };

  // ─── Communication log create ─────────────────────────────────────────

  const handleCommSubmit = async () => {
    if (!selectedMemberId) return;
    if (!commForm.summary.trim()) {
      toast.error('Sila masukkan ringkasan komunikasi.');
      return;
    }

    setCommSubmitting(true);

    try {
      const res = await fetch('/api/members/tools/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          ...commForm,
          followUpDate: commForm.followUpDate || undefined,
          conductedBy: commForm.conductedBy || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCommLogs((prev) => [data, ...prev]);
        setCommDialogOpen(false);
        setCommForm({
          type: 'phone',
          summary: '',
          followUpNeeded: false,
          followUpDate: '',
          priority: 'normal',
          conductedBy: '',
        });
        toast.success('Rekod komunikasi berjaya ditambah!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan rekod.');
      }
    } catch {
      toast.error('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setCommSubmitting(false);
    }
  };

  // ─── No member selected state ─────────────────────────────────────────

  if (!selectedMemberId || !selectedMember) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Alat Ahli</h1>
              <p className="text-sm text-muted-foreground">
                Alat bantu untuk menganalisis dan mengurus ahli PUSPA
              </p>
            </div>
          </div>
        </div>

        {/* Member Selector Card */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Pilih Ahli
            </CardTitle>
            <CardDescription>Pilih ahli untuk menggunakan alat bantu yang tersedia</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedMemberId}
              onValueChange={(val) => handleMemberSelect(val)}
              disabled={membersLoading}
            >
              <SelectTrigger className="w-full sm:w-96">
                <SelectValue placeholder={membersLoading ? 'Memuatkan...' : 'Cari dan pilih ahli...'} />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {categoryLabels[m.category] || m.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {members.length === 0 && !membersLoading && (
              <p className="text-sm text-muted-foreground mt-2">Tiada ahli berdaftar dalam pangkalan data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render with member selected ──────────────────────────────────────

  const latestWelfare = welfareHistory.length > 0 ? welfareHistory[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alat Ahli</h1>
            <p className="text-sm text-muted-foreground">
              Alat bantu untuk menganalisis dan mengurus ahli PUSPA
            </p>
          </div>
        </div>
      </div>

      {/* Member Selector & Info */}
      <Card className="border-emerald-200/50 dark:border-emerald-800/30">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <Select
                value={selectedMemberId}
                onValueChange={(val) => handleMemberSelect(val)}
              >
                <SelectTrigger className="w-full sm:w-96">
                  <SelectValue placeholder="Cari dan pilih ahli..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {categoryLabels[m.category] || m.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Member Quick Info */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="gap-1">
                <User className="w-3 h-3" />
                {categoryLabels[selectedMember.category] || selectedMember.category}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Wallet className="w-3 h-3" />
                RM{selectedMember.monthlyIncome.toLocaleString('ms-MY')}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {selectedMember.familyMembers} orang
              </Badge>
              {selectedMember.address && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="max-w-32 truncate">{selectedMember.address}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Programme Eligibility AI ───────────────────────────────── */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Semakan Kelayakan Program AI</CardTitle>
                  <CardDescription>AI menganalisis kelayakan ahli untuk program PUSPA</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleEligibilityCheck}
                disabled={eligibilityLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {eligibilityLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Semak Kelayakan Program
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {eligibilityLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm text-muted-foreground">AI sedang menganalisis kelayakan...</p>
              </div>
            )}

            {eligibilityResult && !eligibilityLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary */}
                {eligibilityResult.summary && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      {eligibilityResult.summary}
                    </p>
                  </div>
                )}

                {/* Eligible Programmes */}
                {eligibilityResult.eligible.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {eligibilityResult.eligible.map((prog, idx) => (
                      <motion.div
                        key={prog.programmeId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex flex-col items-center gap-1 min-w-[52px]">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getMatchColor(
                              prog.matchScore
                            )}`}
                          >
                            {prog.matchScore}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium text-sm">{prog.programmeName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-5">{prog.reason}</p>
                          {/* Match bar */}
                          <div className="mt-2 ml-5 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-xs">
                            <motion.div
                              className={`h-full rounded-full ${getMatchBarColor(prog.matchScore)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${prog.matchScore}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">Tiada program baru yang layak untuk ahli ini pada masa ini.</p>
                  </div>
                )}
              </motion.div>
            )}

            {!eligibilityLoading && !eligibilityResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Klik butang untuk mula semakan kelayakan program.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Financial Aid Calculator ──────────────────────────────── */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Kalkulator Bantuan Kewangan</CardTitle>
                <CardDescription>Anggar bantuan kewangan berdasarkan formula BMT</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Pendapatan Bulanan (RM)</Label>
                <Input
                  type="number"
                  placeholder="Contoh: 1500"
                  value={aidIncome}
                  onChange={(e) => setAidIncome(e.target.value)}
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Saiz Keluarga (orang)</Label>
                <Input
                  type="number"
                  placeholder="Contoh: 4"
                  value={aidFamilySize}
                  onChange={(e) => setAidFamilySize(e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Kategori Ahli</Label>
                <Select value={aidCategory} onValueChange={setAidCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asnaf">Asnaf</SelectItem>
                    <SelectItem value="volunteer">Sukarelawan</SelectItem>
                    <SelectItem value="donor">Penderma</SelectItem>
                    <SelectItem value="staff">Kakitangan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Keperluan Khas (pilihan)</Label>
                <Input
                  placeholder="Contoh: OKU, warga emas, ibu tunggal"
                  value={aidSpecialNeeds}
                  onChange={(e) => setAidSpecialNeeds(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleAidCalculate}
              disabled={aidLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {aidLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Kira Bantuan
            </Button>

            {/* Results */}
            {aidResult && !aidLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Separator />

                {/* Main Amount */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-muted-foreground mb-1">Bantuan Bulanan Dicadangkan</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                    RM{aidResult.recommendedMonthlyAid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`mt-2 ${
                      aidResult.category.category === 'kritikal'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : aidResult.category.category === 'tinggi'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : aidResult.category.category === 'sederhana'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : aidResult.category.category === 'rendah'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {aidResult.category.label}
                  </Badge>
                </div>

                {/* Visual Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>RM0</span>
                    <span>RM12,000+</span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        aidResult.recommendedMonthlyAid >= 3000
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : aidResult.recommendedMonthlyAid >= 2000
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                            : aidResult.recommendedMonthlyAid >= 1000
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((aidResult.recommendedMonthlyAid / 12000) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 p-3 rounded-lg bg-muted/30 text-xs">
                  <p className="font-medium mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Butiran Pengiraan
                  </p>
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <span className="text-muted-foreground">Garis kemiskinan:</span>
                    <span className="text-right font-medium">RM{aidResult.breakdown.garisKemiskinan.toLocaleString()}</span>
                    <span className="text-muted-foreground">Pendapatan bulanan:</span>
                    <span className="text-right font-medium">RM{aidResult.breakdown.pendapatanBulanan.toLocaleString()}</span>
                    <span className="text-muted-foreground">Jurang pendapatan:</span>
                    <span className="text-right font-medium">RM{aidResult.breakdown.jurangPendapatan.toLocaleString()}</span>
                    <span className="text-muted-foreground">Pendaraban keluarga:</span>
                    <span className="text-right font-medium">×{aidResult.breakdown.pendarabanKeluarga.toFixed(1)}</span>
                    <span className="text-muted-foreground">Kategori:</span>
                    <span className="text-right font-medium">{aidResult.breakdown.kategoriAhli}</span>
                    <span className="text-muted-foreground">Pelarasan:</span>
                    <span className="text-right font-medium">{aidResult.breakdown.pelarasanKategori}</span>
                    {aidResult.breakdown.tambahanKeperluanKhas > 0 && (
                      <>
                        <span className="text-muted-foreground">Keperluan khas:</span>
                        <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          +RM{aidResult.breakdown.tambahanKeperluanKhas}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* ─── Welfare Assessment ─────────────────────────────────────── */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-base">Penilaian Kebajikan</CardTitle>
                <CardDescription>Nilai tahap kebajikan ahli (1 = Kritikal, 5 = Sangat Baik)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {welfareLoadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                {/* Current Score Display */}
                {latestWelfare && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center ${getScoreBg(latestWelfare.overallScore)}`}>
                      <span className={`text-lg font-bold leading-none ${getScoreColor(latestWelfare.overallScore)}`}>
                        {latestWelfare.overallScore.toFixed(1)}
                      </span>
                      <span className="text-[8px] text-muted-foreground mt-0.5">/ 5.0</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Skor Terkini</p>
                      <p className={`text-xs ${getScoreColor(latestWelfare.overallScore)}`}>
                        {getScoreLabel(latestWelfare.overallScore)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatShortDate(latestWelfare.createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sliders */}
                <div className="space-y-3">
                  {welfareDimensions.map((dim) => (
                    <div key={dim.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          {dim.icon}
                          {dim.label}
                        </Label>
                        <span className={`text-xs font-bold ${getScoreColor(welfareScores[dim.key])}`}>
                          {welfareScores[dim.key]}
                        </span>
                      </div>
                      <Slider
                        value={[welfareScores[dim.key]]}
                        onValueChange={([val]) =>
                          setWelfareScores((prev) => ({ ...prev, [dim.key]: val }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Kritikal</span>
                        <span>Sangat Baik</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Catatan</Label>
                  <Textarea
                    placeholder="Catatan penilaian..."
                    value={welfareNotes}
                    onChange={(e) => setWelfareNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={handleWelfareSave}
                  disabled={welfareLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  {welfareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ClipboardCheck className="w-4 h-4" />
                  )}
                  Simpan Penilaian
                </Button>

                {/* History */}
                {welfareHistory.length > 1 && (
                  <div className="space-y-2">
                    <Separator />
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Sejarah Penilaian
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {welfareHistory.slice(1).map((wh) => (
                        <div
                          key={wh.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                wh.overallScore < 2.5
                                  ? 'bg-red-500'
                                  : wh.overallScore < 3.5
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                            />
                            <span className="text-muted-foreground">{formatShortDate(wh.createdAt)}</span>
                          </div>
                          <span className={`font-bold ${getScoreColor(wh.overallScore)}`}>
                            {wh.overallScore.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── Communication Log ──────────────────────────────────────── */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Rekod Komunikasi</CardTitle>
                  <CardDescription>Jejak semua interaksi dan komunikasi dengan ahli</CardDescription>
                </div>
              </div>

              <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Rekod
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Rekod Komunikasi Baru</DialogTitle>
                    <DialogDescription>Tambah rekod interaksi dengan {selectedMember.name}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Jenis Komunikasi</Label>
                      <Select
                        value={commForm.type}
                        onValueChange={(val) =>
                          setCommForm((prev) => ({ ...prev, type: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Telefon</SelectItem>
                          <SelectItem value="visit">Lawatan</SelectItem>
                          <SelectItem value="meeting">Mesyuarat</SelectItem>
                          <SelectItem value="email">E-mel</SelectItem>
                          <SelectItem value="aid-distribution">Agihan Bantuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Ringkasan</Label>
                      <Textarea
                        placeholder="Ringkasan komunikasi..."
                        value={commForm.summary}
                        onChange={(e) =>
                          setCommForm((prev) => ({ ...prev, summary: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Keutamaan</Label>
                        <Select
                          value={commForm.priority}
                          onValueChange={(val) =>
                            setCommForm((prev) => ({ ...prev, priority: val }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Rendah</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Tinggi</SelectItem>
                            <SelectItem value="urgent">Mendesak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Dijalankan Oleh</Label>
                        <Input
                          placeholder="Nama staf"
                          value={commForm.conductedBy}
                          onChange={(e) =>
                            setCommForm((prev) => ({ ...prev, conductedBy: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Perlu Tindakan Susulan</Label>
                        <Button
                          variant={commForm.followUpNeeded ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setCommForm((prev) => ({
                              ...prev,
                              followUpNeeded: !prev.followUpNeeded,
                              followUpDate: !prev.followUpNeeded ? '' : prev.followUpDate,
                            }))
                          }
                          className={
                            commForm.followUpNeeded
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : ''
                          }
                        >
                          {commForm.followUpNeeded ? 'Ya' : 'Tidak'}
                        </Button>
                      </div>

                      {commForm.followUpNeeded && (
                        <div className="space-y-2">
                          <Label className="text-sm">Tarikh Susulan</Label>
                          <Input
                            type="date"
                            value={commForm.followUpDate}
                            onChange={(e) =>
                              setCommForm((prev) => ({
                                ...prev,
                                followUpDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCommDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleCommSubmit}
                      disabled={commSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {commSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Simpan Rekod
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {commLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : commLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tiada rekod komunikasi untuk ahli ini.</p>
                <p className="text-xs mt-1">Klik &quot;Tambah Rekod&quot; untuk mula merekod.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-0">
                {commLogs.map((log, idx) => {
                  const pConfig = priorityConfig[log.priority] || priorityConfig.normal;
                  const isFirst = idx === 0;
                  return (
                    <motion.div
                      key={log.id}
                      initial={isFirst ? { opacity: 0, y: -8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative pl-6 pb-4 last:pb-0"
                    >
                      {/* Timeline line */}
                      <div className="absolute left-[9px] top-2 bottom-0 w-px bg-border" />

                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-[19px] h-[19px] rounded-full flex items-center justify-center bg-background border-2 border-border text-muted-foreground">
                        {commTypeIcons[log.type] || <MessageSquare className="w-3 h-3" />}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {commTypeLabels[log.type] || log.type}
                            </span>
                            <Badge variant="secondary" className={`text-[10px] ${pConfig.className}`}>
                              {pConfig.label}
                            </Badge>
                            {log.followUpNeeded && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              >
                                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                                Susulan
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {log.summary}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(log.createdAt)}
                            </span>
                            {log.conductedBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-2.5 h-2.5" />
                                {log.conductedBy}
                              </span>
                            )}
                            {log.followUpDate && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Calendar className="w-2.5 h-2.5" />
                                Susulan: {formatShortDate(log.followUpDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
