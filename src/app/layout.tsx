import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { itIT, ptBR, esES } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import { ViewportHeight } from "@/components/shared/viewport-height";
import "./globals.css";

export const metadata: Metadata = {
  title: "BYH — Build Your Health",
  description: "La piattaforma per personal trainer e i loro clienti.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // La tastiera virtuale ridimensiona il contenuto (l'input sale con la tastiera)
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getLocale } = await import("@/lib/i18n/server");
  const locale = await getLocale();
  const clerkLocalization =
    locale === "it" ? itIT : locale === "pt" ? ptBR : locale === "es" ? esES : undefined;
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={locale} className="h-full antialiased">
        <body className="min-h-full bg-background text-foreground">
          <ViewportHeight />
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
