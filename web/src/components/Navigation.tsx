'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusSquare, Calendar, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Search', href: '/', icon: Search },
    { name: 'Publish', href: '/publish', icon: PlusSquare },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-6 py-2.5 shadow-lg">
      <div className="flex justify-between items-center px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 relative group outline-none"
            >
              <div 
                className={`p-1.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50 scale-105' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span 
                className={`text-[9px] font-bold tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {item.name}
              </span>
              
              {/* Indicator dot below active navigation tab */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
