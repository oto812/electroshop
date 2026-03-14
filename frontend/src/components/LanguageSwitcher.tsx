import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ka' : 'en');
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="font-semibold">
      {i18n.language === 'en' ? 'KA' : 'EN'}
    </Button>
  );
}
