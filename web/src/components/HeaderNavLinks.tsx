'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusSquare, Calendar, User } from 'lucide-react';

export default function HeaderNavLinks() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Find Rides', href: '/', icon: Search },
    { name: 'Offer a Ride', href: '/publish', icon: PlusSquare },
    { name: 'My Bookings', href: '/bookings', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2]" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
