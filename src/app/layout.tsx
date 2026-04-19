import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PUSPA - Pertubuhan Urus Peduli Asnaf | Sistem Pengurusan",
  description: "Sistem Pengurusan Ahli PUSPA - Pertubuhan Urus Peduli Asnaf KL & Selangor. Membantu keluarga asnaf melalui program bantuan makanan, pendidikan, latihan kemahiran dan kesihatan.",
  keywords: ["PUSPA", "asnaf", "zakat", "kebajikan", "KL", "Selangor", "bantuan makanan", "pendidikan"],
  authors: [{ name: "PUSPA - Pertubuhan Urus Peduli Asnaf" }],
  icons: {
    icon: "/puspa-logo.png",
  },
  openGraph: {
    title: "PUSPA - Sistem Pengurusan Ahli",
    description: "Sistem Pengurusan Ahli Pertubuhan Urus Peduli Asnaf KL & Selangor",
    siteName: "PUSPA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
