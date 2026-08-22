import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Navigation from "@/components/Navigation";
import HeaderNavLinks from "@/components/HeaderNavLinks";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Triqna | Moroccan Intercity Carpooling",
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
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-screen antialiased font-sans text-slate-900 flex flex-col bg-slate-50">
        <ToastProvider>
          {/* Responsive Header Bar */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  triqna
                </span>
                <span className="text-[9px] font-black tracking-widest bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                  OUR ROAD
                </span>
              </Link>

              {/* Desktop Center Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200">
                <HeaderNavLinks />
              </nav>

              {/* Right Action / Country Badge */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Morocco</span>
                </div>
                
                <Link 
                  href="/publish"
                  className="hidden md:flex btn-primary-blue py-1.5 px-4 text-xs font-semibold"
                >
                  + Offer a Ride
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-12">
            {children}
          </main>

          {/* Bottom Navigation Bar (Mobile Only) */}
          <Navigation />

          {/* Desktop Footer */}
          <footer className="hidden md:block border-t border-slate-200 bg-white py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
              <div>
                © 2026 <strong>Triqna</strong> — Moroccan Peer-to-Peer Intercity Cost Sharing Platform.
              </div>
              <div className="flex items-center gap-6">
                <span className="hover:text-slate-800 cursor-pointer">Terms & Safety</span>
                <span className="hover:text-slate-800 cursor-pointer">Legal Limit Caps</span>
                <span className="hover:text-slate-800 cursor-pointer">Support</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
