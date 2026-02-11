import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Phone, HelpCircle, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t.home },
    { path: '/map', icon: Map, label: t.map },
    { path: '/hotlines', icon: Phone, label: t.hotlines },
    { path: '/help', icon: HelpCircle, label: t.help },
    { path: '/profile', icon: User, label: t.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
