/**
 * Device detection utilities for mobile, tablet, and desktop devices
 */

export const isMobileDevice = (): boolean => {
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const userAgent = navigator.userAgent;
  
  // Check user agent
  const isMobileUserAgent = mobileRegex.test(userAgent);
  
  // Check screen size (phones typically < 768px width)
  const isSmallScreen = window.innerWidth < 768;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for mobile-specific features
  const hasMobileFeatures = isMobileUserAgent || (isSmallScreen && isTouchDevice);
  
  return hasMobileFeatures;
};

export const isTabletDevice = (): boolean => {
  const tabletRegex = /iPad|Android.*Tablet|Windows.*Touch/i;
  const userAgent = navigator.userAgent;
  
  // Check user agent for tablets
  const isTabletUserAgent = tabletRegex.test(userAgent);
  
  // Check screen size (tablets typically between 768px and 1024px)
  const isTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isTabletUserAgent || (isTabletScreen && isTouchDevice);
};

export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice();
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

export const getScreenSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight
  };
};
