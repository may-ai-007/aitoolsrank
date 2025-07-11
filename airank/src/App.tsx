import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import Modal from './components/Modal';
import './App.css';

// 应用内容组件，包含路由配置
const AppContent: React.FC = () => {
  const { language } = useAppContext();
  const { t, i18n } = useTranslation();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  // 提供一个打开关于弹窗的方法
  const openAboutModal = () => {
    console.log('Opening about modal');
    setIsAboutModalOpen(true);
  };
  
  // 提供一个关闭关于弹窗的方法
  const closeAboutModal = () => {
    console.log('Closing about modal');
    setIsAboutModalOpen(false);
  };

  // 监听弹窗状态变化
  useEffect(() => {
    console.log('Modal state in App:', isAboutModalOpen);
  }, [isAboutModalOpen]);
  
  // 同步语言设置
  useEffect(() => {
    try {
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(language);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [language, i18n]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenAbout={openAboutModal} />
      <main className="container mx-auto py-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 AI Tools Ranking. {t('about.disclaimer')}</p>
        </div>
      </footer>
      
      {/* 关于页面弹窗 */}
      {isAboutModalOpen && (
        <Modal 
          isOpen={isAboutModalOpen} 
          onClose={closeAboutModal} 
          title={t('about.title')}
        >
          <AboutPage />
        </Modal>
      )}
    </div>
  );
};

// 主应用组件
const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
