import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';

interface HeaderProps {
  onOpenAbout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAbout }) => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useAppContext();

  const toggleLanguage = () => {
    try {
      const newLang = language === 'zh' ? 'en' : 'zh';
      setLanguage(newLang);
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(newLang);
      }
    } catch (error) {
      // console.error('Failed to toggle language:', error);
    }
  };

  const handleNavClick = (page: string) => {
    if (page === 'about') {
      // console.log('About link clicked - opening modal');
      onOpenAbout();
    }
    // 添加对'home'类型的处理，防止空白页面
    if (page === 'home') {
      // console.log('Home link clicked - navigating to home page');
      // 使用window.location.hash确保正确导航到首页
      window.location.hash = '/';
    }
  };

  // 副标题文本，根据当前语言显示
  const getSubtitle = () => {
    return language === 'zh' 
      ? '找地表最强AI？这里排名说了算！' 
      : 'Find Earth\'s Best AI? This Rank Rules!';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and site title with subtitle */}
          <div className="flex items-center">
            <a 
              href="#/" 
              className="flex items-start text-xl font-bold text-gray-900"
              onClick={() => handleNavClick('home')}
            >
              <img 
                src="/fly.svg" 
                alt="AIrank Logo" 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  marginRight: '8px',
                  marginTop: '2px' 
                }}
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold">{t('app.title')}</span>
                <span className="text-xs text-gray-500 font-normal mt-1">
                  {getSubtitle()}
                </span>
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <a 
              href="#/" 
              className="px-3 py-2 font-medium text-blue-600"
              onClick={() => handleNavClick('home')}
            >
              {t('nav.home')}
            </a>
            <a 
              href="#" 
              className="px-3 py-2 text-gray-700 hover:text-gray-900"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('about');
              }}
            >
              {t('nav.about')}
            </a>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
              aria-label="Toggle language"
            >
              <div className="flex items-center space-x-1">
                <FaGlobe className="text-lg" />
                <span className="text-sm">{language === 'zh' ? 'EN' : '中'}</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 