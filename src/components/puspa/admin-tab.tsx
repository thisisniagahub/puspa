'use client';

import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Heart,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Banknote,
  Shield,
  HandshakeIcon,
  Star,
  Calendar,
  Landmark,
  UtensilsCrossed,
  Briefcase,
  CircleDollarSign,
  ArrowRight,
  Copy,
  Check,
  BadgeCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

// ─── Data ──────────────────────────────────────────────────────────────

const orgInfo = {
  fullName: 'Pertubuhan Urus Peduli Asnaf (PUSPA)',
  acronym: 'PUSPA',
  founded: 'Sejak 2018',
  yearsOfService: 7,
  address: '2253, Jalan Permata 22, Taman Permata, 53300 Gombak, Selangor',
  email: 'salam.puspaKL@gmail.com',
  phone: '+6012-3183369',
  website: 'puspa.org.my',
  focus: 'Membantu keluarga asnaf di Kuala Lumpur dan Selangor',
};

interface BoardMember {
  role: string;
  name: string;
  icon: string;
}

const boardMembers: BoardMember[] = [
  { role: 'Penasihat', name: 'Prof. Emeritus Datuk Ismail Hassan', icon: '🎓' },
  { role: 'Pengerusi', name: 'Datuk Dr Narimah Awin', icon: '⭐' },
  { role: 'Naib Pengerusi', name: 'Datin Noor Khayatee Mohd Adnan', icon: '🌟' },
  { role: 'Bendahari', name: 'YM Raja Nuraini Raja Hassan', icon: '💰' },
  { role: 'Setiausaha', name: 'Pn Shahidah @ Fauziah Hashim', icon: '📋' },
  { role: 'Pegawai Operasi', name: 'Zaki', icon: '⚙️' },
];

interface Partner {
  name: string;
  icon: React.ReactNode;
}

const partners: Partner[] = [
  { name: 'S P Setia Foundation', icon: <Landmark className="size-6 text-purple-600" /> },
  { name: 'Perumahan Kinrara Berhad', icon: <Building2 className="size-6 text-purple-600" /> },
  { name: 'Jaya Grocer', icon: <UtensilsCrossed className="size-6 text-purple-600" /> },
  { name: 'Free Food Society', icon: <Heart className="size-6 text-purple-600" /> },
  { name: 'Kloth Cares / Kloth Circularity', icon: <CircleDollarSign className="size-6 text-purple-600" /> },
  { name: 'Lembaga Zakat Selangor', icon: <Banknote className="size-6 text-purple-600" /> },
];

interface ProgrammeStat {
  title: string;
  icon: React.ReactNode;
  stats: string[];
}

const programmeStats: ProgrammeStat[] = [
  {
    title: 'Bantuan Makanan',
    icon: <Heart className="size-5 text-rose-500" />,
    stats: ['1,200+ keluarga', '15 lokasi'],
  },
  {
    title: 'Pendidikan',
    icon: <GraduationCap className="size-5 text-blue-500" />,
    stats: ['850+ pelajar', '50+ tutor', '95% kadar lulus'],
  },
  {
    title: 'Latihan Kemahiran',
    icon: <Briefcase className="size-5 text-amber-500" />,
    stats: ['300+ peserta', '12 kursus', '70% pekerjaan'],
  },
  {
    title: 'Kesihatan',
    icon: <Stethoscope className="size-5 text-teal-500" />,
    stats: ['2,000+ penerima manfaat', '25+ doktor'],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

export default function AdminTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
          <Shield className="size-5 text-purple-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Pentadbiran
          </h2>
          <p className="text-sm text-muted-foreground">
            Maklumat organisasi, kepimpinan & rakan strategik
          </p>
        </div>
      </div>

      {/* ── Section 1: Organization Info ───────────────────────────── */}
      <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-950 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-purple-600 shadow-md">
                <Building2 className="size-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{orgInfo.fullName}</CardTitle>
                <CardDescription>{orgInfo.focus}</CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white hover:bg-purple-700">
              <Calendar className="mr-1 size-3" />
              {orgInfo.founded}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-900">
              <MapPin className="mt-0.5 size-4 shrink-0 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{orgInfo.address}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-900">
              <Mail className="size-4 shrink-0 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{orgInfo.email}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-900">
              <Phone className="size-4 shrink-0 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{orgInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-gray-900">
              <Globe className="size-4 shrink-0 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{orgInfo.website}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white">
            <Star className="size-4" />
            <span className="text-sm font-medium">
              {orgInfo.yearsOfService} tahun berkhidmat untuk komuniti asnaf
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Leadership / Board Members ─────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Jawatankuasa & Kepimpinan
          </h3>
        </div>

        {/* Top row: Penasihat & Pengerusi */}
        <div className="grid gap-4 md:grid-cols-2">
          {boardMembers.slice(0, 2).map((member) => (
            <Card
              key={member.role}
              className="border-amber-200 bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-950 dark:to-amber-950/10"
            >
              <CardContent className="flex items-center gap-4 py-5">
                <Avatar className="size-14 border-2 border-amber-300 bg-amber-100">
                  <AvatarFallback className="bg-amber-100 text-2xl">
                    {member.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Badge className="mb-1 bg-amber-500 text-white hover:bg-amber-600">
                    {member.role}
                  </Badge>
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                    {member.name}
                  </p>
                </div>
                <BadgeCheck className="size-5 shrink-0 text-amber-500" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Remaining members */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {boardMembers.slice(2).map((member) => (
            <Card
              key={member.role}
              className="transition-all hover:border-purple-300 hover:shadow-md dark:hover:border-purple-700"
            >
              <CardContent className="flex items-center gap-3 py-4">
                <Avatar className="size-10 border border-purple-200 bg-purple-50">
                  <AvatarFallback className="bg-purple-50 text-lg">
                    {member.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-purple-600">{member.role}</p>
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {member.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 3: Programme Portfolio Summary ────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Portfolio Program
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {programmeStats.map((program) => (
            <Card
              key={program.title}
              className="group transition-all hover:border-purple-300 hover:shadow-md dark:hover:border-purple-700"
            >
              <CardContent className="space-y-3 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                    {program.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {program.title}
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {program.stats.map((stat) => (
                    <div
                      key={stat}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <ArrowRight className="size-3 text-purple-500" />
                      <span>{stat}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 4: Key Partners ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HandshakeIcon className="size-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Rakan Strategik
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <Card
              key={partner.name}
              className="group transition-all hover:border-purple-300 hover:shadow-md dark:hover:border-purple-700"
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  {partner.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {partner.name}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 5: Contact / Donation Info ────────────────────── */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 shadow-md">
              <Banknote className="size-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Maklumat Sumbangan</CardTitle>
              <CardDescription>
                Salurkan sumbangan anda untuk membantu asnaf
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Banknote className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Maybank</p>
                <p className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                  5622 0967 7503
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCopy('562209677503')}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 min-h-[44px] px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-purple-500" />
                  <span className="text-purple-600">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-purple-600/10 p-3 dark:bg-purple-600/20">
            <Shield className="mt-0.5 size-4 shrink-0 text-purple-600" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Resit akan diberikan</span> kepada semua penderma
              sebagai rekod sumbangan anda. Terima kasih atas sokongan anda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
