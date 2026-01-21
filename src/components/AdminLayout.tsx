import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, AlertTriangle, Building2, Users, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { path: '/admin/hazards', icon: AlertTriangle, label: 'Hazards' },
    { path: '/admin/centers', icon: Building2, label: 'Evac Centers' },
    { path: '/admin/users', icon: Users, label: t.manageUsers },
    { path: '/admin/reports', icon: FileText, label: t.viewReports },
  ];

  return (
    <div className="min-h-screen flex w-full bg-[#0f172a]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] border-r border-slate-700 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">SafeNav Admin</h1>
              <p className="text-xs text-slate-400">Disaster Risk Management</p>
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
                    : 'hover:bg-slate-800 text-slate-400'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <LanguageToggle />
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between p-4 bg-[#0f172a] border-b border-slate-700">
          <div>
            <h1 className="font-bold text-xl text-white">SafeNav Admin</h1>
            <p className="text-sm text-slate-400">Disaster Risk Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600 hover:bg-green-600 text-white px-3 py-1">
              Admin
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white">SafeNav Admin</span>
              <p className="text-xs text-slate-400">Disaster Risk Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
              Admin
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:bg-red-500/10 h-8 w-8"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#0f172a]">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-700 z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2',
                    isActive ? 'text-white' : 'text-slate-500'
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
    </div>
  );
};

export default AdminLayout;
