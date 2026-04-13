import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const I18nDirection: React.FC = () => {
    const { i18n } = useTranslation();
    useEffect(() => {
        const lng = i18n.language;
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    }, [i18n.language]);
    return null;
};
export default I18nDirection;
