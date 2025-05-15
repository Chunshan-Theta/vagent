'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/app/lib/utils';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Tools', href: '/admin/tools' },
    { name: 'New Tool', href: '/admin/tools/new' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">Tools Management</h1>
              <nav className="flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  );
} 