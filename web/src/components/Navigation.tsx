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
    <nav className="absolute bottom-0 left-0 right-0 z-40 border-t border-neutral-900/60 bg-[#070709]/80 backdrop-blur-xl px-6 py-3">
      <div className="flex justify-between items-center px-4">
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
                    ? 'text-[var(--color-emerald)] bg-[rgba(5,150,105,0.08)] scale-110' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span 
                className={`text-[9px] font-bold tracking-tight transition-colors duration-250 ${
                  isActive ? 'text-[var(--color-emerald)]' : 'text-neutral-500 group-hover:text-neutral-300'
                }`}
              >
                {item.name}
              </span>
              
              {/* Premium indicator dot below active navigation tab */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--color-emerald)] shadow-[0_0_8px_var(--color-emerald)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
