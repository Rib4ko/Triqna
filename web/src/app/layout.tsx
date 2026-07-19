import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Triqna | Premium Moroccan Intercity Carpooling",
  description: "Peer-to-peer intercity carpooling for Morocco. Safe, legal cost-sharing rides.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#030303]">
      <body className="h-full antialiased font-sans text-white flex justify-center items-center p-0 sm:p-4">
        {/* Mobile PWA Shell centered on screen */}
        <div className="w-full h-full sm:h-[850px] max-w-md bg-[#030303] sm:border sm:border-neutral-800/50 sm:rounded-[28px] flex flex-col relative overflow-hidden shadow-[0_0_80px_rgba(5,150,105,0.05),0_30px_70px_rgba(0,0,0,0.85)]">
          {/* Header - Glassmorphic */}
          <header className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-900/65 bg-[#030303]/85 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">triqna</span>
              <span className="text-[8px] font-black tracking-widest bg-[rgba(5,150,105,0.12)] text-[var(--color-emerald)] border border-[rgba(5,150,105,0.25)] px-2 py-0.5 rounded-full">
                OUR ROAD
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0c0c0e]/80 px-3 py-1 rounded-full border border-neutral-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)] animate-pulse shadow-[0_0_8px_var(--color-emerald)]" />
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Morocco</span>
            </div>
          </header>

          {/* Core Content Area */}
          <main className="flex-1 overflow-y-auto pb-28 px-6 py-6 bg-[#030303]">
            {children}
          </main>

          {/* Bottom navigation */}
          <Navigation />
        </div>
      </body>
    </html>
  );
}
