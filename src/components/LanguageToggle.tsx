import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, flag: '🇺🇸', label: 'EN' },
    { code: 'fil' as const, flag: '🇵🇭', label: 'FIL' },
    { code: 'ceb' as const, flag: '🇵🇭', label: 'CEB' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
              <Globe className="w-4 h-4" />
              <span className="text-xs">{currentLang.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={language === lang.code ? 'bg-secondary' : ''}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Button group */}
      <div className="hidden md:flex items-center gap-1 bg-secondary rounded-lg p-1">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage(lang.code)}
            className="text-xs px-2 py-1 h-8"
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.label}
          </Button>
        ))}
      </div>
    </>
  );
};

export default LanguageToggle;
