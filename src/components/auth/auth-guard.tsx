'use client';

import { useAuth } from "@/lib/auth-context";
import { useSyncExternalStore } from "react";
import LoginPage from "@/components/auth/login-page";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { user, isLoading } = useAuth();

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
