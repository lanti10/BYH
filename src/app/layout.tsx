import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { itIT, ptBR, esES } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "BYH — Build Your Health",
  description: "La piattaforma per personal trainer e i loro clienti.",
  manifest: "/manifest.webmanifest",
  // Icona home (iOS "Aggiungi a Home") + tab: usa apple-icon.jpg / icon.jpg (il logo rosso BYH)
  appleWebApp: { capable: true, title: "BYH", statusBarStyle: "default" },
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
          {/* Applica il tema salvato prima del paint per evitare il flash bianco */}
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem('byh-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
            }}
          />
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
