import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '../../../data/achievements';
import { Artwork } from '../../../data/artworks';
import { welcomeContent, contactContent } from '../../../data/content';

interface ContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content?: {
    type: 'welcome' | 'achievement' | 'art' | 'about' | 'contact';
    data?: Achievement | Artwork | any;
  };
}

const ContentPopup: React.FC<ContentPopupProps> = ({ 
  isOpen = false, 
  onClose,
  content 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile/tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);
  
  const renderContent = () => {
    if (!content) return null;

    switch (content.type) {
      case 'welcome':
        return (
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#667eea',
              marginBottom: '24px', 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
              fontFamily: 'inherit',
              margin: '0 0 24px 0'
            }}>
              🌟 {welcomeContent.title} 🌟
            </h1>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <p style={{ 
                color: '#1a202c', 
                fontSize: '18px',
                marginBottom: '20px', 
                lineHeight: '1.7',
                textAlign: 'center',
                fontWeight: '500',
                fontFamily: 'inherit',
                margin: '0 0 20px 0'
              }}>
                {welcomeContent.message}
              </p>
              <p style={{ 
                color: '#4a5568', 
                fontSize: '16px',
                marginBottom: '20px', 
                lineHeight: '1.6',
                fontFamily: 'inherit',
                margin: '0 0 20px 0'
              }}>
                Explore my interactive 3D world to discover:
              </p>
              <ul style={{ 
                listStyle: 'none', 
                marginBottom: '0',
                padding: '0'
              }}>
                <li style={{ 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ marginRight: '12px', fontSize: '20px' }}>🏆</span>
                  <span style={{ color: '#2d3748', fontFamily: 'inherit', fontWeight: '500' }}>My achievements and awards</span>
                </li>
                <li style={{ 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ marginRight: '12px', fontSize: '20px' }}>🎨</span>
                  <span style={{ color: '#2d3748', fontFamily: 'inherit', fontWeight: '500' }}>My artwork collection</span>
                </li>
                <li style={{ 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ marginRight: '12px', fontSize: '20px' }}>📖</span>
                  <span style={{ color: '#2d3748', fontFamily: 'inherit', fontWeight: '500' }}>Learn more about me</span>
                </li>
                <li style={{ 
                  marginBottom: '0',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ marginRight: '12px', fontSize: '20px' }}>📧</span>
                  <span style={{ color: '#2d3748', fontFamily: 'inherit', fontWeight: '500' }}>How to get in touch</span>
                </li>
            </ul>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px', 
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                lineHeight: '1.5',
                fontFamily: 'inherit'
              }}>
                🎮 Use WASD or arrow keys to move around and click on objects to interact!
              </p>
            </div>
          </div>
        );

      case 'achievement':
        const achievement = content.data as Achievement;
        return (
          <div>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              color: '#f59e0b',
              marginBottom: '24px', 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
              fontFamily: 'inherit',
              margin: '0 0 24px 0'
            }}>
              🏆 Achievement Unlocked!
            </h1>
            <div style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', 
              color: 'white', 
              padding: '32px', 
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
              border: '3px solid #fed7aa'
            }}>
              <div style={{ 
                fontSize: '60px', 
                marginBottom: '16px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>
                {achievement?.emoji}
              </div>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontFamily: 'inherit',
                margin: '0 0 16px 0'
              }}>
                {achievement?.title}
            </h2>
              <p style={{ 
                fontSize: '18px',
                lineHeight: '1.6',
                opacity: '0.95',
                fontWeight: '500',
                fontFamily: 'inherit',
                margin: '0'
              }}>
                {achievement?.desc}
              </p>
            </div>
          </div>
        );

      case 'art':
        const artwork = content.data as Artwork;
        return (
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#a855f7',
              marginBottom: '24px', 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(168, 85, 247, 0.2)',
              fontFamily: 'inherit',
              margin: '0 0 24px 0'
            }}>
              🎨 Featured Artwork
            </h1>
            <div style={{ 
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f472b6 100%)', 
              color: 'white', 
              padding: '32px', 
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}>
                  {artwork?.emoji}
                </div>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginBottom: '12px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontFamily: 'inherit',
                  margin: '0 0 12px 0'
                }}>
                  {artwork?.title}
            </h2>
                <p style={{ 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  opacity: '0.95',
                  fontWeight: '500',
                  marginBottom: '20px',
                  fontFamily: 'inherit',
                  margin: '0 0 20px 0'
                }}>
                  {artwork?.desc}
                </p>
              </div>
              {artwork?.filename && (
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <img 
                    src={`/assets/art/${artwork.filename}`}
                    alt={artwork.title}
                    style={{
                      width: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      cursor: 'pointer'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    onClick={openFullscreen}
                  />
                  <button
                    onClick={openFullscreen}
                    style={{
                      position: 'absolute',
                      top: '30px',
                      right: '30px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{fontSize: '16px'}}>🔍</span>
                    Fullscreen
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'about':
        return (
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#10b981',
              marginBottom: '24px', 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
              fontFamily: 'inherit',
              margin: '0 0 24px 0'
            }}>
              📖 About Me
            </h1>
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #bbf7d0',
              marginBottom: '24px'
            }}>
              <p style={{ 
                color: '#1f2937', 
                fontSize: '18px',
                marginBottom: '20px', 
                lineHeight: '1.7',
                textAlign: 'center',
                fontWeight: '500',
                fontFamily: 'inherit',
                margin: '0 0 20px 0'
              }}>
                Hello! I'm a creative and curious student who loves:
              </p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { icon: '🎨', text: 'Creating art in all forms' },
                  { icon: '📚', text: 'Learning new things every day' },
                  { icon: '🔬', text: 'Science experiments and discoveries' },
                  { icon: '🎭', text: 'Theater and performance' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #d1fae5',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
                  }}>
                    <span style={{ 
                      fontSize: '24px', 
                      marginRight: '16px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}>{item.icon}</span>
                    <span style={{ 
                      fontSize: '16px', 
                      color: '#1f2937',
                      fontWeight: '500',
                      fontFamily: 'inherit'
                    }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '24px', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontFamily: 'inherit',
                margin: '0 0 8px 0'
              }}>
                My Mission
            </h2>
              <p style={{
                fontSize: '16px',
                margin: '0',
                lineHeight: '1.6',
                fontWeight: '500',
                opacity: '0.95',
                fontFamily: 'inherit'
              }}>
                To use creativity and technology to make the world a better place!
              </p>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#3b82f6',
              marginBottom: '24px', 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
              fontFamily: 'inherit',
              margin: '0 0 24px 0'
            }}>
              📧 Let's Connect!
            </h1>
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #bfdbfe',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ 
                color: '#1f2937', 
                fontSize: '18px',
                marginBottom: '24px', 
                lineHeight: '1.7',
                fontWeight: '500',
                fontFamily: 'inherit',
                margin: '0 0 24px 0'
              }}>
                Want to collaborate or just say hi? Here's how to reach me:
              </p>
              <div style={{ display: 'grid', gap: '16px' }}>
                {contactContent.contacts.map((contact, index) => {
                  const contactColors: { [key: string]: string } = {
                    'Email': '#ef4444',
                    'Twitter': '#1da1f2', 
                    'Instagram': '#e4405f',
                    'DeviantArt': '#05cc47'
                  };
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #bfdbfe',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                      transition: 'transform 0.2s ease'
                    }}>
                      <div style={{
                        fontSize: '28px',
                        marginRight: '20px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}>
                        {contact.emoji}
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: contactColors[contact.platform],
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontFamily: 'inherit'
                        }}>
                          {contact.platform}
                        </div>
                        <div style={{
                          fontSize: '16px',
                          color: '#1f2937',
                          fontWeight: '500',
                          fontFamily: 'inherit'
                        }}>
                          {contact.handle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '20px', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
            }}>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0',
                lineHeight: '1.5',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontFamily: 'inherit'
              }}>
                💬 I'd love to hear from you!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // Fullscreen overlay for artwork
  if (isFullscreen && content?.type === 'art' && content.data) {
    const artwork = content.data as Artwork;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20000,
          padding: isMobile ? '20px' : '40px'
        }}
        onClick={closeFullscreen}
      >
        <div style={{
          position: 'relative',
          width: '95vw',
          height: '90vh',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '20px' : '40px',
          maxWidth: '1400px'
        }}>
          {/* Left side - Image */}
          <div style={{
            flex: isMobile ? '0 0 auto' : '1',
            height: isMobile ? '50%' : '100%',
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? 'auto' : '50%'
          }}>
            <img
              src={`/assets/art/${artwork.filename}`}
              alt={artwork.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 12px 60px rgba(0,0,0,0.8)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Right side - Text content */}
          <div style={{
            flex: isMobile ? '0 0 auto' : '0 0 400px',
            height: isMobile ? 'auto' : '100%',
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isMobile ? '24px' : '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 60px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            maxWidth: isMobile ? 'none' : '450px',
            overflowY: isMobile ? 'auto' : 'visible'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Emoji */}
            <div style={{
              fontSize: isMobile ? '60px' : '80px',
              textAlign: 'center',
              marginBottom: isMobile ? '16px' : '24px',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              lineHeight: '1'
            }}>
              {artwork.emoji}
            </div>
            
            {/* Title */}
            <h2 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '800',
              color: '#1a202c',
              marginBottom: isMobile ? '16px' : '24px',
              textAlign: 'center',
              lineHeight: '1.2',
              fontFamily: 'inherit',
              margin: isMobile ? '0 0 16px 0' : '0 0 24px 0',
              textShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {artwork.title}
            </h2>
            
            {/* Description */}
            <div style={{
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              padding: isMobile ? '20px' : '28px',
              borderRadius: '16px',
              border: `2px solid ${artwork.frameColor}`,
              marginBottom: isMobile ? '24px' : '32px'
            }}>
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: '1.7',
                color: '#374151',
                fontWeight: '500',
                textAlign: 'center',
                margin: '0',
                fontFamily: 'inherit'
              }}>
                {artwork.desc}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              border: 'none',
              borderRadius: '50%',
              fontSize: '32px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(20px)',
              zIndex: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)';
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
          onClick={onClose}
        >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#1a202c'
        }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '40px',
            height: '40px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 10001,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
            >
              ×
            </button>

            {/* Content */}
        <div>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ContentPopup;
