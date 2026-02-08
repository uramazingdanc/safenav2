import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'admin';
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fil', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'ceb', label: 'Cebuano', flag: '🇵🇭' },
];

const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2',
            variant === 'admin' 
              ? 'text-white/70 hover:text-white hover:bg-command-muted bg-slate-700' 
              : 'text-muted-foreground hover:text-foreground bg-secondary'
          )}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage?.flag} {currentLanguage?.label}</span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          'w-40',
          variant === 'admin' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-background border-border'
        )}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'cursor-pointer gap-2',
              variant === 'admin' 
                ? 'text-slate-300 hover:text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white' 
                : '',
              language === lang.code && (variant === 'admin' ? 'bg-ocean/20 text-ocean' : 'bg-primary/10 text-primary')
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
