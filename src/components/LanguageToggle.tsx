import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, flag: '🇺🇸', label: 'EN' },
    { code: 'fil' as const, flag: '🇵🇭', label: 'FIL' },
    { code: 'ceb' as const, flag: '🇵🇭', label: 'CEB' },
  ];

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
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
  );
};

export default LanguageToggle;
