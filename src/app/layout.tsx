import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  title: "PUSPA - Pertubuhan Urus Peduli Asnaf | Sistem Pengurusan",
  description:
    "Sistem Pengurusan Ahli PUSPA - Pertubuhan Urus Peduli Asnaf KL & Selangor. Membantu keluarga asnaf melalui program bantuan makanan, pendidikan, latihan kemahiran dan kesihatan.",
  keywords: [
    "PUSPA",
    "asnaf",
    "zakat",
    "kebajikan",
    "KL",
    "Selangor",
    "bantuan makanan",
    "pendidikan",
  ],
  authors: [{ name: "PUSPA - Pertubuhan Urus Peduli Asnaf" }],
  icons: {
    icon: "/puspa-logo-official.png",
    apple: "/puspa-logo-official.png",
  },
  openGraph: {
    title: "PUSPA - Sistem Pengurusan Ahli",
    description:
      "Sistem Pengurusan Ahli Pertubuhan Urus Peduli Asnaf KL & Selangor",
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
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
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
        className={`${poppins.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
