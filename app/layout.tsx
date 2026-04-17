import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import JsonLd from "@/components/JsonLd";
import { organizationSchema, globalSoftwareApplicationSchema, globalFaqSchema } from "@/lib/schema";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    default: "Gestivio — Logiciel de gestion d'interventions pour entrepreneurs au Québec",
    template: "%s | Gestivio",
  },
  description: "Gérez vos clients, interventions et factures en un seul endroit. Logiciel bilingue fait au Québec pour plombiers, électriciens, CVC et entrepreneurs de service. Essai gratuit 14 jours.",
  keywords: ["logiciel gestion intervention Québec", "logiciel plombier Québec", "logiciel électricien Québec", "logiciel entrepreneur service", "facturation entrepreneur Québec", "field service management Quebec", "contractor software Canada", "logiciel CVC Québec"],
  authors: [{ name: "Gestivio Inc." }],
  creator: "Gestivio Inc.",
  publisher: "Gestivio Inc.",
  metadataBase: new URL("https://gestivio.ca"),
  openGraph: {
    type: "website",
    locale: "fr_CA",
    alternateLocale: "en_CA",
    url: "https://gestivio.ca",
    siteName: "Gestivio",
    title: "Gestivio — Logiciel de gestion d'interventions pour entrepreneurs au Québec",
    description: "Gérez vos clients, interventions et factures en un seul endroit. Logiciel bilingue fait au Québec pour plombiers, électriciens, CVC et entrepreneurs de service.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestivio — Logiciel de gestion pour entrepreneurs au Québec",
    description: "Gérez vos clients, interventions et factures en un seul endroit. Fait au Québec. Essai gratuit 14 jours.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationSchema(), globalSoftwareApplicationSchema(), globalFaqSchema()]} />
        <GoogleAnalytics />
        <ThemeProvider>
          <LanguageProvider>
            <ConfirmProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
              <Toaster position="top-right" richColors closeButton duration={4000} />
            </ConfirmProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
