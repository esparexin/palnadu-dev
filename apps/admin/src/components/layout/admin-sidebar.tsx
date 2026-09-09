'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderKanban,
  Briefcase,
  FileText,
  PenSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: UserPlus },
  { title: 'Clients', href: '/clients', icon: Users },
  { title: 'Projects', href: '/projects', icon: FolderKanban },
  { title: 'Services', href: '/services', icon: Briefcase },
  { title: 'Case Studies', href: '/case-studies', icon: FileText },
  { title: 'Blog', href: '/blog', icon: PenSquare },
  { title: 'Media', href: '/media', icon: ImageIcon },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-palnadu-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/palnadu-logo-horizontal.png"
            alt="Palnadu.dev"
            width={180}
            height={26}
            priority
            unoptimized
            className="h-7 w-auto"
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto" aria-label="Admin navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-palnadu-blue text-white shadow-2xs'
                  : 'text-palnadu-body hover:bg-palnadu-light-blue hover:text-palnadu-blue',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout & Profile Footer */}
      <div className="border-t border-palnadu-border p-3.5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold text-palnadu-body hover:bg-red-50 hover:text-palnadu-error transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar with Logo */}
      <header className="fixed top-0 inset-x-0 h-14 z-30 bg-white border-b border-palnadu-border flex items-center justify-between px-4 lg:hidden">
        <button
          className="rounded-md border border-palnadu-border bg-white p-1.5 text-palnadu-dark hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5 text-palnadu-blue" /> : <Menu className="h-5 w-5 text-palnadu-dark" />}
        </button>

        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/palnadu-logo-horizontal.png"
            alt="Palnadu.dev"
            width={150}
            height={22}
            priority
            unoptimized
            className="h-5 w-auto"
          />
        </Link>

        <div className="w-8" aria-hidden="true" />
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-60 border-r border-palnadu-border bg-white transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
