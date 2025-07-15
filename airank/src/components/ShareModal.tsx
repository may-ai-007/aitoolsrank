import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimesCircle, FaTwitter, FaFacebook } from 'react-icons/fa';
import { BsWechat } from 'react-icons/bs';
import html2canvas from 'html2canvas';
import { useAppContext } from '../contexts/AppContext';
import type { AITool } from '../utils/dataUtils';
import { formatNumber } from '../utils/dataUtils';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: AITool[];
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, tools }) => {
  const { t } = useTranslation();
  const { rankingType, language } = useAppContext();
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  // 保留setQrCodeType函数以供调用，但使用_忽略未使用的变量警告
  const [_qrCodeType, setQrCodeType] = useState<'wechat' | 'wechatMoments'>('wechat');
  const [showShareInfo, setShowShareInfo] = useState(false);
  
  // 在模态框打开时禁止页面滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // 当模态框打开时生成图片
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        generateImage();
      }, 500);
    } else {
      setImageUrl(null);
      setImageFile(null);
      setShowShareInfo(false);
      setShowQRCode(false);
    }
  }, [isOpen, rankingType]);
  
  // 生成要分享的图片
  const generateImage = async () => {
    if (!imageContainerRef.current) return;
    
    setGeneratingImage(true);
    
    try {
      const canvas = await html2canvas(imageContainerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
      
      // 将 dataURL 转换为 Blob
      const blobData = await (await fetch(dataUrl)).blob();
      
      // 创建 File 对象用于分享
      const fileName = `airank-${rankingType}-${new Date().toISOString().split('T')[0]}.png`;
      const imageFile = new File([blobData], fileName, { type: 'image/png' });
      setImageFile(imageFile);
    } catch (error) {
      console.error('生成图片时出错:', error);
    } finally {
      setGeneratingImage(false);
    }
  };
  
  // 检查是否支持Web Share API分享文件
  const canShareWithWebShareAPI = () => {
    if (!navigator.share || !navigator.canShare) return false;
    if (!imageFile) return false;
    
    return navigator.canShare({ files: [imageFile] });
  };
  
  // 处理分享选项点击
  const handleShareOptionClick = async (option: string) => {
    if (!imageUrl || !imageFile) return;
    
    // 尝试使用Web Share API (仅限移动设备)
    if (option !== 'download' && canShareWithWebShareAPI()) {
      try {
        await navigator.share({
          title: language === 'zh' ? 'AI工具排行榜' : 'AI Tools Ranking',
          text: language === 'zh' 
            ? `查看AI工具${t(`rankings.${rankingType}`)}` 
            : `Check out this ${t(`rankings.${rankingType}`)} of AI tools`,
          url: window.location.href,
          files: [imageFile]
        });
        console.log('分享成功');
        return;
      } catch (error) {
        console.error('Web Share API分享失败:', error);
        // 继续使用平台特定的分享方法
      }
    }
    
    // 平台特定的分享方法
    switch (option) {
      case 'twitter':
        // 使用Twitter的Web Intent URL
        const twitterText = language === 'zh' 
          ? `AI工具排行榜 - ${t(`rankings.${rankingType}`)} | aitoolsrank.online` 
          : `AI Tools Ranking - ${t(`rankings.${rankingType}`)} | aitoolsrank.online`;
        
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
        
        // 显示图片下载提示
        setShowShareInfo(true);
        break;
        
      case 'facebook':
        // 使用Facebook分享URL
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
        
        // 显示图片下载提示
        setShowShareInfo(true);
        break;
        
      case 'wechat':
      case 'wechatMoments':
        // 对于微信分享，我们提供二维码
        setQrCodeType(option === 'wechat' ? 'wechat' : 'wechatMoments');
        setShowQRCode(true);
        break;
        
      case 'download':
        // 直接下载图片
        downloadImage();
        break;
        
      default:
        break;
    }
  };
  
  // 下载图片函数
  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `airank-${rankingType}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 获取表头根据不同的排名类型
  const getTableHeaders = () => {
    switch (rankingType) {
      case 'total_rank':
        return (
          <tr>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.rank')}</th>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">LOGO</th>
            <th className="px-3 py-2 text-left bg-gray-50 border-b">{t('table.columns.name')}</th>
            <th className="px-3 py-2 text-right bg-gray-50 border-b">{t('table.columns.total_traffic')}</th>
          </tr>
        );
      case 'monthly_rank':
        return (
          <tr>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.rank')}</th>
            <th className="px-3 py-2 text-left bg-gray-50 border-b">{t('table.columns.name')}</th>
            <th className="px-3 py-2 text-right bg-gray-50 border-b">{t('table.columns.traffic')}</th>
          </tr>
        );
      case 'income_rank':
        return (
          <tr>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.rank')}</th>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">LOGO</th>
            <th className="px-3 py-2 text-left bg-gray-50 border-b">{t('table.columns.name')}</th>
            <th className="px-3 py-2 text-right bg-gray-50 border-b">{t('table.columns.traffic')}</th>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.payment')}</th>
          </tr>
        );
      case 'region_rank':
        return (
          <tr>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.rank')}</th>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">LOGO</th>
            <th className="px-3 py-2 text-left bg-gray-50 border-b">{t('table.columns.name')}</th>
            <th className="px-3 py-2 text-right bg-gray-50 border-b">{t('table.columns.region_traffic')}</th>
            <th className="px-3 py-2 text-center bg-gray-50 border-b">{t('table.columns.main_region')}</th>
          </tr>
        );
      default:
        return null;
    }
  };
  
  // 渲染表格行
  const renderTableRows = () => {
    // 显示前50个工具
    const visibleTools = tools.slice(0, 50);
    
    return visibleTools.map((tool, index) => {
      // 渲染Logo
      const renderLogo = () => {
        const logoUrl = tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=random&color=fff`;
        return (
          <div style={{ 
            width: '20px', 
            height: '20px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6'
          }}>
            <img 
              src={logoUrl} 
              alt={`${tool.name} logo`} 
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=random&color=fff`;
              }}
            />
          </div>
        );
      };
      
      switch (rankingType) {
        case 'total_rank':
          return (
            <tr key={tool.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-center border-b">{tool.rank}</td>
              <td className="px-3 py-2 text-center border-b">
                {renderLogo()}
              </td>
              <td className="px-3 py-2 text-left border-b font-medium">{tool.name}</td>
              <td className="px-3 py-2 text-right border-b">{formatNumber(tool.monthly_visits, language)}</td>
            </tr>
          );
        case 'monthly_rank':
          return (
            <tr key={tool.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-center border-b">{tool.rank}</td>
              <td className="px-3 py-2 text-left border-b font-medium">{tool.name}</td>
              <td className="px-3 py-2 text-right border-b">{formatNumber(tool.monthly_visits, language)}</td>
            </tr>
          );
        case 'income_rank':
          return (
            <tr key={tool.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-center border-b">{tool.rank}</td>
              <td className="px-3 py-2 text-center border-b">
                {renderLogo()}
              </td>
              <td className="px-3 py-2 text-left border-b font-medium">{tool.name}</td>
              <td className="px-3 py-2 text-right border-b">{formatNumber(tool.monthly_visits, language)}</td>
              <td className="px-3 py-2 text-center border-b">
                {tool.payment_platform 
                  ? (Array.isArray(tool.payment_platform) 
                    ? tool.payment_platform.join(', ')
                    : String(tool.payment_platform))
                  : '-'}
              </td>
            </tr>
          );
        case 'region_rank':
          return (
            <tr key={tool.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-center border-b">{tool.rank}</td>
              <td className="px-3 py-2 text-center border-b">
                {renderLogo()}
              </td>
              <td className="px-3 py-2 text-left border-b font-medium">{tool.name}</td>
              <td className="px-3 py-2 text-right border-b">
                {tool.region_monthly_visits 
                  ? formatNumber(Math.round(tool.region_monthly_visits), language)
                  : '-'}
              </td>
              <td className="px-3 py-2 text-center border-b">{tool.top_region || '-'}</td>
            </tr>
          );
        default:
          return null;
      }
    });
  };
  
  if (!isOpen) return null;
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };
  
  const contentStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-40px',
    right: 0,
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer'
  };
  
  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain'
  };
  
  const loadingStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  const shareButtonsStyle: React.CSSProperties = {
    position: 'absolute',
    right: '-60px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };
  
  const shareButtonStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    color: '#333'
  };
  
  const qrCodeStyle: React.CSSProperties = {
    position: 'absolute',
    right: '-180px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: showQRCode ? 'block' : 'none'
  };
  
  const shareInfoStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    textAlign: 'center',
    display: showShareInfo ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1100,
    width: '350px',
    maxWidth: '90%'
  };
  
  // 获取图片标题
  const getImageTitle = () => {
    return language === 'zh' ? `AI产品榜 · ${t(`rankings.${rankingType}`)}` : `AI Tools · ${t(`rankings.${rankingType}`)}`;
  };
  
  // 获取图片数据来源文本
  const getSourceText = () => {
    return language === 'zh' 
      ? '仅包含网站(web)，不包含应用(APP) | 数据来源: aitoolsrank.online' 
      : 'Web only, no apps | Source: aitoolsrank.online';
  };
  
  // 获取图片更新时间文本
  const getUpdateTimeText = () => {
    return language === 'zh'
      ? `数据更新时间: ${new Date().toLocaleDateString()}`
      : `Data updated: ${new Date().toLocaleDateString()}`;
  };
  
  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>
          <FaTimesCircle size={32} />
        </button>
        
        {generatingImage ? (
          <div style={loadingStyle}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #3B82F6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '16px', color: '#4B5563', fontSize: '18px' }}>{t('share.generating')}</p>
          </div>
        ) : imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt="排行榜分享图片" 
              style={imageStyle}
            />
            <div style={shareButtonsStyle}>
              <div 
                style={{...shareButtonStyle, backgroundColor: '#1DA1F2'}} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareOptionClick('twitter');
                }}
                title={t('share.twitter_title') as string}
              >
                <FaTwitter color="white" size={18} />
              </div>
              <div 
                style={{...shareButtonStyle, backgroundColor: '#4267B2'}} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareOptionClick('facebook');
                }}
                title={t('share.facebook_title') as string}
              >
                <FaFacebook color="white" size={18} />
              </div>
              <div 
                style={{...shareButtonStyle, backgroundColor: '#07C160'}} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareOptionClick('wechat');
                }}
                title={t('share.wechat_friend_title') as string}
              >
                <BsWechat color="white" size={18} />
              </div>
              <div 
                style={{...shareButtonStyle, backgroundColor: '#07C160'}} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareOptionClick('wechatMoments');
                }}
                title={t('share.wechat_moments_title') as string}
              >
                <svg viewBox="0 0 1024 1024" width="18" height="18" fill="white">
                  <path d="M512 1024C229.23 1024 0 794.77 0 512S229.23 0 512 0s512 229.23 512 512-229.23 512-512 512z m0.43-800a279.25 279.25 0 0 0-32.563 1.915c-26.152 2.949-51.221 9.459-74.787 18.913 0 0 194.316 191.609 199.49 198.731V239.23c-5.79-1.965-11.707-3.734-17.672-5.38-23.736-6.363-48.708-9.85-74.468-9.85z m202.97 83.24c-7.79-7.76-15.951-14.935-24.38-21.588a286.85 286.85 0 0 0-66.284-39.3s1.43 272.315 0 281.011L769.78 382.867a293.184 293.184 0 0 0-8.729-16.213c-12.3-21.22-27.433-41.288-45.65-59.413z m63.669 98.298S586.825 599.134 579.627 604.291h205.089c1.97-5.77 3.748-11.668 5.373-17.61 6.408-23.703 9.912-48.51 9.912-74.202 0-10.98-0.692-21.811-1.952-32.446a282.69 282.69 0 0 0-18.98-74.495zM493.867 625.807l145.041 144.498a287.549 287.549 0 0 0 16.294-8.695c21.3-12.208 41.414-27.312 59.656-45.487 7.762-7.74 14.938-15.894 21.643-24.29 16.34-20.539 29.532-42.765 39.439-66.05 0 0-273.32 1.427-282.073 0.024z m-74.417-45.39V784.77a294.79 294.79 0 0 0 17.673 5.357c23.765 6.386 48.687 9.872 74.471 9.872 10.992 0 21.863-0.686 32.513-1.914a286.83 286.83 0 0 0 74.788-18.94c0.024 0-194.27-191.555-199.445-198.728z m-20.41-85.23L254.045 639.682c2.714 5.528 5.647 10.933 8.728 16.236 12.253 21.271 27.41 41.313 45.652 59.465 7.765 7.763 15.95 14.91 24.378 21.566 20.63 16.336 42.892 29.426 66.31 39.298 0 0-1.479-272.34-0.076-281.06z m-165.157-57.745C227.5 461.121 224 485.953 224 511.646c0 10.953 0.692 21.809 1.948 32.421 2.959 26.083 9.441 51.064 19.006 74.496 0 0 192.223-193.598 199.42-198.732H239.26c-1.972 5.746-3.747 11.666-5.376 17.611z m133.531-173.948c-21.346 12.232-41.461 27.34-59.655 45.464-7.838 7.788-14.986 15.942-21.666 24.29-16.369 20.539-29.532 42.79-39.464 66.1 0 0 273.368-1.45 282.096-0.05L383.705 254.8c-5.518 2.749-10.967 5.625-16.29 8.694z" />
                </svg>
              </div>
              <div 
                style={{...shareButtonStyle, backgroundColor: '#333'}} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareOptionClick('download');
                }}
                title={t('share.download') as string}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
              </div>
            </div>
            <div style={qrCodeStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG 
                  value={window.location.href}
                  size={150}
                  includeMargin={true}
                  level="H"
                />
                <p style={{ marginTop: '8px', fontSize: '14px' }}>{t('share.wechat_scan_tip')}</p>
                <button 
                  style={{ 
                    marginTop: '8px', 
                    padding: '4px 8px', 
                    backgroundColor: '#f1f1f1', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowQRCode(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={loadingStyle}>
            <p style={{ color: '#4B5563' }}>{t('share.loading')}</p>
          </div>
        )}
      </div>
      
      {/* 社交媒体分享提示 */}
      {showShareInfo && (
        <div style={shareInfoStyle} onClick={(e) => e.stopPropagation()}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>
            {language === 'zh' 
              ? '社交媒体分享已打开，请点击下载按钮获取图片后手动添加到您的分享中。' 
              : 'Social media sharing opened. Please click the download button to get the image and manually add it to your share.'}
          </p>
          <button 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#3B82F6', 
              color: 'white',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={(e) => {
              e.stopPropagation();
              downloadImage();
              setShowShareInfo(false);
            }}
          >
            {t('share.download')}
          </button>
          <button
            style={{ 
              marginTop: '10px',
              padding: '8px 16px', 
              backgroundColor: '#f1f1f1', 
              color: '#333',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => setShowShareInfo(false)}
          >
            {language === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      )}
      
      {/* 隐藏的图片生成容器 */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <div 
          ref={imageContainerRef}
          style={{ backgroundColor: 'white', padding: '24px', width: '800px' }}
        >
          {/* 图片头部 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <img 
              src="/fly.svg" 
              alt="AIrank Logo" 
              style={{ 
                width: '36px', 
                height: '36px',
                marginRight: '10px'
              }} 
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{getImageTitle()}</h1>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                {getSourceText()}
              </p>
            </div>
          </div>
          
          {/* 图片表格内容 */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {getTableHeaders()}
              </thead>
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
          
          {/* 图片底部 */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280' }}>
            <p style={{ margin: 0 }}>{getUpdateTimeText()}</p>
            <p style={{ margin: 0 }}>aitoolsrank.online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 