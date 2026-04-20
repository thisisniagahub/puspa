import type { Metadata, Viewport } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PUSPA - Pertubuhan Urus Peduli Asnaf | Sistem Pengurusan NGO",
  description: "Platform pengurusan komprehensif untuk Pertubuhan Urus Peduli Asnaf - Case management, donations, programmes, and disbursements.",
  keywords: ["PUSPA", "asnaf", "zakat", "kebajikan", "NGO", "case management", "charity"],
  authors: [{ name: "PUSPA - Pertubuhan Urus Peduli Asnaf" }],
  icons: {
    icon: "/puspa-logo-official.png",
    apple: "/puspa-logo-official.png",
  },
  openGraph: {
    title: "PUSPA - Sistem Pengurusan NGO",
    description: "Platform pengurusan komprehensif untuk Pertubuhan Urus Peduli Asnaf",
    siteName: "PUSPA",
    type: "website",
    locale: "ms_MY",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
