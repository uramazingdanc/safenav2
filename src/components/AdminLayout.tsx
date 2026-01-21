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
    <div className="min-h-screen flex w-full" style={{ backgroundColor: '#0f172a' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 text-white h-screen sticky top-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0D253F] rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">SafeNav</h1>
              <p className="text-xs text-slate-400">Command Center</p>
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
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-700/50 text-slate-300'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => setShowGuide(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t.systemGuide}
          </Button>
          <LanguageToggle />
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/20 hover:text-red-300"
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
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-800 text-white border-b border-slate-700">
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2',
                    isActive ? 'text-blue-400' : 'text-slate-400'
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
