import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  AlertTriangle, 
  Building2, 
  Users, 
  FileText, 
  LogOut, 
  Map,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const AdminLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { path: '/admin/map', icon: Map, label: 'Live Map' },
    { path: '/admin/hazards', icon: AlertTriangle, label: 'Hazards' },
    { path: '/admin/centers', icon: Building2, label: 'Evac Centers' },
    { path: '/admin/users', icon: Users, label: t.manageUsers },
    { path: '/admin/reports', icon: FileText, label: t.viewReports },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex w-full command-theme bg-command">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop: Always visible, Mobile: Slide out */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-command flex flex-col transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="p-5 border-b border-command-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white">SafeNav</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Command Center</p>
            </div>
          </div>
          <button 
            onClick={closeSidebar}
            className="md:hidden p-1 hover:bg-command-muted rounded-lg text-white/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-ocean text-white shadow-lg shadow-ocean/25'
                    : 'text-white/70 hover:bg-command-muted hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-command-muted space-y-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-command-muted/50 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60">System Online</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-command/95 backdrop-blur border-b border-command-muted">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-command-muted rounded-xl text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Page title */}
              <div className="hidden md:block">
                <h2 className="font-semibold text-white">
                  {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-white/50">Naval, Biliran DRRM Operations</p>
              </div>
              
              {/* Mobile logo */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-ocean rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm text-white">SafeNav</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <LanguageSwitcher variant="admin" />
              
              {/* Notifications */}
              <NotificationCenter />
              
              {/* Admin Badge */}
              <Badge className="bg-ocean hover:bg-ocean text-white px-3 py-1 text-xs hidden sm:inline-flex">
                Admin
              </Badge>
              
              {/* Mobile sign out */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-command">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-command border-t border-command-muted z-40">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2 transition-all',
                    isActive ? 'text-ocean' : 'text-white/50'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                  <span className="text-[10px] mt-1 font-medium truncate max-w-[60px]">
                    {item.label.split(' ')[0]}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

export default AdminLayout;
