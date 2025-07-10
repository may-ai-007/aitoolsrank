import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enTranslations, zhTranslations } from './translations';

// 获取用户首选语言或从 localStorage 中读取
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en'; // 默认使用英文
  } catch (e) {
    return 'en';
  }
};

// 初始化i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      zh: { translation: zhTranslations }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: false // 关闭debug模式
  });

export default i18n; 