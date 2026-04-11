import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gestivio — Field Service Management Platform",
    template: "%s | Gestivio",
  },
  description: "Manage customers, jobs, and invoices for your field service business. AI-powered scheduling, invoicing, and analytics. Made in Québec, Canada.",
  keywords: ["field service management", "FSM software", "job management", "invoice software", "HVAC software", "plumbing software", "trade business software", "Canada", "Quebec"],
  authors: [{ name: "Gestivio Inc." }],
  creator: "Gestivio Inc.",
  publisher: "Gestivio Inc.",
  metadataBase: new URL("https://gestivio.ca"),
  openGraph: {
    type: "website",
    locale: "en_CA",
    alternateLocale: "fr_CA",
    url: "https://gestivio.ca",
    siteName: "Gestivio",
    title: "Gestivio — Field Service Management Platform",
    description: "Manage customers, jobs, and invoices for your field service business. AI-powered. Made in Québec, Canada.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestivio — Field Service Management Platform",
    description: "Manage customers, jobs, and invoices for your field service business. AI-powered.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ThemeProvider><LanguageProvider>{children}</LanguageProvider></ThemeProvider></body>
    </html>
  );
}
