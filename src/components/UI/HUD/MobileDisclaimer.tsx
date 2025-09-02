import React from 'react';

interface MobileDisclaimerProps {
  onContinueAnyway?: () => void;
}

const MobileDisclaimer: React.FC<MobileDisclaimerProps> = ({ onContinueAnyway }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        {/* Main Card */}
        <div 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}
        >
          
          {/* Header Section */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              padding: '32px 24px',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg 
                style={{ width: '32px', height: '32px', color: 'white' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 18h.01M8 21h8a1 1 0 001-1V5a1 1 0 00-1-1H8a1 1 0 00-1 1v15a1 1 0 001 1z" 
                />
              </svg>
            </div>
            <h1 
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.2',
                margin: '0 0 4px 0'
              }}
            >
              Desktop Experience
            </h1>
            <p 
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                margin: '0'
              }}
            >
              Required
            </p>
          </div>

          {/* Content Section */}
          <div style={{ padding: '24px', color: '#374151' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p 
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#6b7280',
                  margin: '0'
                }}
              >
                This 3D portfolio is optimized for desktop computers and tablets with larger screens.
              </p>
            </div>

            {/* Requirements */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <h3 
                style={{
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  margin: '0 0 12px 0'
                }}
              >
                Requirements
              </h3>
              <div>
                {[
                  'Screen width ≥ 1024px',
                  'Keyboard navigation',
                  'WebGL 3D support',
                  'Modern browser'
                ].map((requirement, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#374151',
                      marginBottom: index < 3 ? '8px' : '0'
                    }}
                  >
                    <div 
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#7c3aed',
                        borderRadius: '50%',
                        marginRight: '12px',
                        flexShrink: 0
                      }}
                    />
                    <span>{requirement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {onContinueAnyway && (
                <button
                  onClick={onContinueAnyway}
                  style={{
                    width: '100%',
                    color: 'white',
                    fontWeight: '600',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Continue Anyway
                </button>
              )}
              
              {/* Contact Info */}
              <div 
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <p 
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}
                >
                  Need to get in touch?
                </p>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg 
                    style={{ width: '16px', height: '16px', color: '#6b7280' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                    />
                  </svg>
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    alexandr@portfolio.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb'
            }}
          >
            <p 
              style={{
                fontSize: '12px',
                textAlign: 'center',
                color: '#6b7280',
                fontWeight: '500',
                margin: '0'
              }}
            >
              🎨 Alexandr's Creative Portfolio
            </p>
          </div>
        </div>
        
        {/* Bottom hint */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p 
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              margin: '0'
            }}
          >
            Best viewed on desktop or tablet
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileDisclaimer;
