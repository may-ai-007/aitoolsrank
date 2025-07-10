import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useAppContext();
  const isZh = language === 'zh';
  
  return (
    <div className="max-w-full">
      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            {t('about.description')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('about.content.overview1')}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {t('about.content.overview2')}
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            {t('about.content.dataSources.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {t('about.content.dataSources.description')}
          </p>
          <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
            <li>{t('about.content.dataSources.items.traffic')}</li>
            <li>{t('about.content.dataSources.items.directories')}</li>
            <li>{t('about.content.dataSources.items.apis')}</li>
            <li>{t('about.content.dataSources.items.company')}</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            {t('about.content.methodology.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {t('about.content.methodology.description')}
          </p>
          <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
            <li><strong>{t('about.content.methodology.items.monthly.title')}</strong> {t('about.content.methodology.items.monthly.description')}</li>
            <li><strong>{t('about.content.methodology.items.total.title')}</strong> {t('about.content.methodology.items.total.description')}</li>
            <li><strong>{t('about.content.methodology.items.income.title')}</strong> {t('about.content.methodology.items.income.description')}</li>
            <li><strong>{t('about.content.methodology.items.region.title')}</strong> {t('about.content.methodology.items.region.description')}</li>
          </ul>
        </section>

        {/* AI新闻周报网站信息 - 添加淡淡的背景色和线框 */}
        <section className="mb-6 bg-blue-50 p-5 rounded-lg border border-blue-200">
          <div className="flex items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800">
              <span>{isZh ? 'AI新闻周报' : 'AI News Weekly'}</span>
            </h2>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">NEW</span>
          </div>
          
          <p className="text-gray-700 mb-4">
            {isZh 
              ? '我们还提供一份关于全球AI行业的精选周报，不仅仅是新闻的直接搬运，而是通过AI分析提供增量信息价值。' 
              : 'We also offer a curated weekly newsletter on global AI industry news, providing not just news aggregation but added value through AI analysis.'}
          </p>
          
          <div className="flex flex-col space-y-3">
            <div>
              <h3 className="font-medium text-blue-700">
                {isZh ? '探索全球AI趋势' : 'Explore Global AI Trends'}
              </h3>
              <p className="text-sm text-gray-600">
                {isZh ? '每周更新，AI精选分析' : 'Updated weekly with AI-curated insights'}
              </p>
            </div>
            
            <a 
              href="https://www.ainewsweekly.world/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm self-start"
            >
              <span>{isZh ? '访问网站' : 'Visit Site'}</span>
              <FaExternalLinkAlt className="ml-1 text-xs" />
            </a>
          </div>
        </section>
        
        <section className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
            {t('about.content.disclaimer.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('about.disclaimer')}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
            {t('about.copyright')}
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 