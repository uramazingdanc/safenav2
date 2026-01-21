import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, AlertTriangle, Building2, Users, FileText, Settings, LogOut, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageToggle from './LanguageToggle';
import VideoManualModal from './VideoManualModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const AdminLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { path: '/admin/hazards', icon: AlertTriangle, label: 'Hazards' },
    { path: '/admin/centers', icon: Building2, label: 'Evac Centers' },
    { path: '/admin/users', icon: Users, label: t.manageUsers },
    { path: '/admin/reports', icon: FileText, label: t.viewReports },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background admin-theme">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-destructive text-destructive-foreground h-screen sticky top-0">
        <div className="p-6 border-b border-destructive-foreground/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive-foreground/20 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">SafeNav</h1>
              <p className="text-xs text-destructive-foreground/70">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-destructive-foreground/20'
                    : 'hover:bg-destructive-foreground/10 text-destructive-foreground/80'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-destructive-foreground/20 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start border-destructive-foreground/30 text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={() => setShowGuide(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t.systemGuide}
          </Button>
          <LanguageToggle />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive-foreground/70 hover:bg-destructive-foreground/10"
            onClick={() => navigate('/admin/login')}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-destructive text-destructive-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            <span className="font-bold">Admin</span>
          </div>
          <LanguageToggle />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2',
                    isActive ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] mt-1">{item.label.split(' ')[0]}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </main>

      <VideoManualModal open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

export default AdminLayout;
