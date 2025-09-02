import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Achievement } from '../data/achievements';
import { Artwork } from '../data/artworks';

export type PopupContent = {
  type: 'welcome' | 'achievement' | 'art' | 'about' | 'contact';
  data?: Achievement | Artwork | any;
};

interface PopupContextType {
  isOpen: boolean;
  content: PopupContent | undefined;
  openPopup: (content: PopupContent) => void;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<PopupContent | undefined>(undefined);

  const openPopup = useCallback((popupContent: PopupContent) => {

    setContent(popupContent);
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setContent(undefined);
  }, []);

  const value = {
    isOpen,
    content,
    openPopup,
    closePopup
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextType => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
