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
import { useState, useEffect } from 'react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EDITOR', 'DEVELOPER'] },
  { title: 'Leads', href: '/leads', icon: UserPlus, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'] },
  { title: 'Clients', href: '/clients', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'] },
  { title: 'Projects', href: '/projects', icon: FolderKanban, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'] },
  { title: 'Services', href: '/services', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: 'Case Studies', href: '/case-studies', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  { title: 'Blog', href: '/blog', icon: PenSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  { title: 'Media', href: '/media', icon: ImageIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  { title: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { title: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('SUPER_ADMIN');
  const [userName, setUserName] = useState<string>('Admin');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role) setUserRole(parsed.role);
        if (parsed.name) setUserName(parsed.name);
      }
    } catch {}
  }, []);

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
          <BrandLogo size="md" />
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-palnadu-light-blue text-palnadu-blue">ADMIN</span>
        </Link>
      </div>

      {/* Navigation Links (Filtered by RBAC User Role) */}
      <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto" aria-label="Admin navigation">
        {sidebarItems
          .filter((item) => item.roles.includes(userRole))
          .map((item) => {
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

      {/* User Profile Badge & Logout */}
      <div className="border-t border-palnadu-border p-3.5 space-y-2">
        <div className="px-2 py-1 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-palnadu-dark truncate">{userName}</p>
            <p className="text-[10px] font-mono text-palnadu-secondary uppercase tracking-wider">
              {userRole.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-xs font-semibold text-palnadu-body hover:bg-red-50 hover:text-palnadu-error transition-colors cursor-pointer"
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
          <BrandLogo size="sm" />
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
