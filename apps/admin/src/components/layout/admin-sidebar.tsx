'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderKanban,
  Briefcase,
  FileText,
  PenSquare,
  Image,
  MessageSquareQuote,
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
  { title: 'Media', href: '/media', icon: Image },
  { title: 'Testimonials', href: '/testimonials', icon: MessageSquareQuote },
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
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold">
          Palnadu<span className="text-muted-foreground">.dev</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
