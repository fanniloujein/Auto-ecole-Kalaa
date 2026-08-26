import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto-École | Gestion",
  description: "Plateforme de gestion interne pour auto-école",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
