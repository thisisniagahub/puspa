'use client';

import { type FormEvent, type ReactNode, useState } from "react";
import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const spotlightTransition = {
  duration: 12,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

const highlights = [
  {
    title: "Operasi tersusun",
    description: "Pantau ahli, bantuan dan aktiviti dalam satu ruang kerja yang kemas.",
    icon: Users2,
  },
  {
    title: "Akses lebih terjamin",
    description: "Aliran log masuk kekal selamat dengan pengalaman yang jelas dan meyakinkan.",
    icon: ShieldCheck,
  },
  {
    title: "Sedia untuk pasukan",
    description: "Direka untuk pengurusan NGO yang bergerak pantas, tanpa rasa terlalu teknikal.",
    icon: Sparkles,
  },
];

const credentials = [
  "Rekod bantuan dan kes dipusatkan",
  "Paparan profesional untuk operator dan pentadbir",
  "Prestasi ringan, animasi kemas, dan mesra pengeluaran",
];

export default function LoginPage() {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isClient || authLoading) {
    return <LoginSkeleton />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Sila masukkan emel dan kata laluan");
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error ?? "Gagal log masuk");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.97_0.05_310),transparent_35%),linear-gradient(135deg,oklch(0.985_0.002_300),oklch(0.96_0.012_300))] dark:bg-[radial-gradient(circle_at_top,oklch(0.22_0.06_305),transparent_30%),linear-gradient(160deg,oklch(0.11_0.02_300),oklch(0.14_0.03_300))]">
      <motion.div
        aria-hidden
        className="absolute -top-32 left-[-10%] h-80 w-80 rounded-full bg-primary/18 blur-3xl"
        animate={{ x: [0, 36, -16], y: [0, 24, -12], scale: [1, 1.08, 0.98] }}
        transition={spotlightTransition}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full bg-primary/12 blur-3xl"
        animate={{ x: [0, -24, 18], y: [0, -18, 12], scale: [1, 0.96, 1.04] }}
        transition={{ ...spotlightTransition, duration: 14 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_calc(100%-1px),oklch(0.55_0.03_300/0.07)_100%),linear-gradient(to_bottom,transparent_0,transparent_calc(100%-1px),oklch(0.55_0.03_300/0.07)_100%)] bg-[size:72px_72px] opacity-40" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:gap-12">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-4 py-1.5 text-sm text-foreground/80 shadow-sm backdrop-blur-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
                Platform pengurusan NGO yang kemas dan diyakini
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.92 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.12, duration: 0.45 }}
                    className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-white/40 bg-[linear-gradient(145deg,oklch(0.57_0.24_300),oklch(0.64_0.18_330))] text-3xl font-bold text-white shadow-2xl shadow-primary/20"
                  >
                    P
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/75">PUSPA</p>
                    <p className="text-sm text-muted-foreground">Pertubuhan Urus Peduli Asnaf</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-lg text-4xl font-semibold leading-tight text-foreground xl:text-5xl">
                    Ruang log masuk yang lebih tenang, premium, dan bersedia untuk operasi harian.
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground xl:text-lg">
                    Direka untuk pasukan NGO yang perlukan keyakinan visual, akses pantas, dan pengalaman kerja yang terasa profesional sejak skrin pertama.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}
                    >
                      <FeatureCard title={item.title} description={item.description}>
                        <Icon className="h-5 w-5" />
                      </FeatureCard>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.45 }}
                className="rounded-[2rem] border border-white/45 bg-white/70 p-6 shadow-xl shadow-primary/8 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Kenapa pengalaman ini diubah</p>
                    <p className="text-sm text-muted-foreground">Supaya akses terasa lebih meyakinkan untuk operator dan pentadbir.</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-3">
                  {credentials.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-foreground/85">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-xl"
          >
            <Card className="overflow-hidden rounded-[2rem] border-white/55 bg-white/78 shadow-[0_30px_120px_-40px_oklch(0.45_0.18_300/0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-card/85">
              <div className="relative border-b border-border/60 px-6 py-5 sm:px-8">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,oklch(0.57_0.24_300),oklch(0.64_0.18_330))] font-bold text-white shadow-lg shadow-primary/20">
                      P
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-[0.24em] text-primary/75">PUSPA</p>
                      <p className="text-sm text-muted-foreground">Sistem Pengurusan NGO</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    Akses selamat
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Log masuk ke ruang operasi anda</h2>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    Teruskan kerja pengurusan kes, bantuan dan aktiviti dengan pengalaman yang lebih jelas dan profesional.
                  </p>
                </div>
              </div>

              <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="mb-6 grid gap-3 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4 lg:hidden">
                  {highlights.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence initial={false}>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2.5">
                    <Label htmlFor="email">Emel</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@puspa.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                        className="h-12 rounded-xl border-border/70 bg-background/70 pl-11 shadow-sm transition-[border,box-shadow,background] focus-visible:border-primary/40 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password">Kata laluan</Label>
                      <p className="text-xs text-muted-foreground">Gunakan kelayakan rasmi organisasi</p>
                    </div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={loading}
                        className="h-12 rounded-xl border-border/70 bg-background/70 pl-11 pr-12 shadow-sm transition-[border,box-shadow,background] focus-visible:border-primary/40 focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan"}
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.div whileTap={{ scale: loading ? 1 : 0.995 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,oklch(0.53_0.22_300),oklch(0.63_0.18_330))] text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-transform hover:translate-y-[-1px] hover:shadow-xl hover:shadow-primary/25"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memuatkan...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Log Masuk
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-6 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Akses untuk pengguna sah sahaja</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Sekiranya anda menghadapi masalah log masuk, semak semula emel organisasi dan kata laluan semasa.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Pertubuhan Urus Peduli Asnaf © {new Date().getFullYear()}
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group h-full rounded-[1.5rem] border border-white/45 bg-white/65 p-4 shadow-lg shadow-primary/6 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {children}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,oklch(0.985_0.002_300),oklch(0.96_0.012_300))] p-4 dark:bg-[linear-gradient(160deg,oklch(0.11_0.02_300),oklch(0.14_0.03_300))]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden space-y-6 lg:block">
          <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
          <div className="h-16 w-4/5 animate-pulse rounded-3xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-muted" />
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-muted" />
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-muted" />
          </div>
        </div>
        <div className="w-full max-w-xl justify-self-center">
          <div className="overflow-hidden rounded-[2rem] border bg-card/80 shadow-xl">
            <div className="space-y-4 border-b p-8">
              <div className="h-12 w-40 animate-pulse rounded-2xl bg-muted" />
              <div className="h-8 w-72 animate-pulse rounded-2xl bg-muted" />
              <div className="h-5 w-full animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="space-y-4 p-8">
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
