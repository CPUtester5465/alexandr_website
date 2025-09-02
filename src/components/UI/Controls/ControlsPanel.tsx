import React from 'react';
import { motion } from 'framer-motion';

const ControlsPanel: React.FC = () => {
  const controls = [
    { keys: ['↑', 'W'], label: 'Move Forward' },
    { keys: ['↓', 'S'], label: 'Move Back' },
    { keys: ['←', 'A'], label: 'Move Left' },
    { keys: ['→', 'D'], label: 'Move Right' },
    { keys: ['SPACE'], label: 'Jump' }
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30"
    >
      <div 
        className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-3xl shadow-xl border border-white/20"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <h3 
          className="text-secondary font-bold text-lg mb-3 text-center"
          style={{
            fontFamily: 'inherit',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}
        >
          🎮 Controls
        </h3>
        
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {controls.map((control, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex gap-1">
                {control.keys.map((key, keyIndex) => (
                  <span 
                    key={keyIndex}
                    className="bg-gradient-to-br from-primary to-secondary text-white px-3 py-1 rounded-lg text-sm font-bold shadow-md"
                    style={{
                      fontFamily: 'inherit',
                      fontWeight: '600'
                    }}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
          
          {/* Special interaction hint */}
          <div 
            className="ml-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
            style={{
              fontFamily: 'inherit',
              fontWeight: '500'
            }}
          >
            Click Objects to Interact
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ControlsPanel;
