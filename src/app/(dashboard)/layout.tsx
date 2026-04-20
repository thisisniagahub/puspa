import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CommandPalette } from "@/components/puspa/command-palette";

export const metadata: Metadata = {
  title: "PUSPA — Sistem Pengurusan NGO",
  description: "Platform pengurusan komprehensif untuk Pertubuhan Urus Peduli Asnaf",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
