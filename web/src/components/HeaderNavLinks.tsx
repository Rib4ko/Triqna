'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusSquare, Calendar, User, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

export default function HeaderNavLinks() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const navItems = [
    { name: 'Find Rides', href: '/', icon: Search },
    { name: 'Offer a Ride', href: '/publish', icon: PlusSquare },
    { name: 'My Bookings', href: '/bookings', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2]" />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {user ? (
        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => openAuth('login')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            onClick={() => openAuth('signup')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
          >
            <span>Sign Up</span>
          </button>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
