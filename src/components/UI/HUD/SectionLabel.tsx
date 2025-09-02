import React from 'react';
import { motion } from 'framer-motion';
import { useCurrentSection } from '../../../hooks/useCurrentSection';

const SectionLabel: React.FC = () => {
  const currentSection = useCurrentSection();
  return (
    <motion.div
      key={currentSection}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40"
    >
      <div 
        className="bg-white/95 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border border-white/20"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <h1 
          className="text-xl font-bold text-secondary text-center whitespace-nowrap"
          style={{
            fontFamily: 'inherit',
            fontWeight: '700',
            margin: '0'
          }}
        >
          {currentSection}
        </h1>
      </div>
    </motion.div>
  );
};

export default SectionLabel;
