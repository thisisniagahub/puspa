'use client';

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const quickLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error ?? "Gagal log masuk");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg shadow-primary/20"
          >
            P
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">PUSPA</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistem Pengurusan NGO</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl shadow-primary/5 border-primary/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Log Masuk</CardTitle>
            <CardDescription>Masuk ke sistem pengurusan PUSPA</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Emel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@puspa.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Laluan</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuatkan...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Log Masuk
                  </>
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Akaun Demo</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Pentadbir", email: "admin@puspa.org", pass: "admin123", color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40" },
                  { label: "Operasi", email: "ops@puspa.org", pass: "ops123", color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40" },
                  { label: "Kewangan", email: "finance@puspa.org", pass: "finance123", color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40" },
                  { label: "Sukarelawan", email: "volunteer@puspa.org", pass: "volunteer123", color: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40" },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => quickLogin(account.email, account.pass)}
                    disabled={loading}
                    className={cn(
                      "text-xs font-medium px-3 py-2 rounded-lg transition-colors text-left",
                      account.color
                    )}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pertubuhan Urus Peduli Asnaf &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted animate-pulse" />
          <div className="h-6 w-24 mx-auto bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-11 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-11 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-11 w-full bg-muted rounded-md animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
