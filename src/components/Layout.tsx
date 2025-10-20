import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ArrowUpDown,
  Settings as SettingsIcon,
  Menu,
  CheckCircle2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assets', label: 'Assets', icon: TrendingUp },
  { path: '/liabilities', label: 'Liabilities', icon: TrendingDown },
  { path: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
  { path: '/transactions', label: 'Transactions', icon: ArrowUpDown },
  { path: '/due-transactions', label: 'Due Transactions', icon: CheckCircle2 },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

const NavContent = () => {
  const location = useLocation();

  return (
    <>
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Finance Tracker</h1>
        <p className="text-sm text-muted-foreground">Manage your wealth</p>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:w-64 border-r border-border bg-card flex-col">
        <NavContent />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <NavContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-auto">
        {/* Mobile Header with Burger Menu */}
        <div className="lg:hidden sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Finance Tracker</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
