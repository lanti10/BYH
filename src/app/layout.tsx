import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ViewportHeight } from "@/components/shared/viewport-height";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="it" className={`${geist.variable} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground">
          <ViewportHeight />
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
