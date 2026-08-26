import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tells you how to move, in the language of the device you are holding.
 *
 * PROVISIONAL STYLING. The visual design of the whole HUD is being reworked in
 * its own phase; what matters here is that the hints are correct for the input
 * mode and that the panel fits a phone. Do not polish this -- it is going to be
 * replaced wholesale.
 */

interface ControlsPanelProps {
  isTouch: boolean;
}

const TOUCH_HINTS = [
  { key: 'Tap', label: 'walk there' },
  { key: 'Double-tap', label: 'jump' },
  { key: 'Drag', label: 'look around' },
  { key: 'Pinch', label: 'zoom' }
];

const POINTER_HINTS = [
  { key: 'W A S D', label: 'move' },
  { key: 'Space', label: 'jump' },
  { key: 'Click', label: 'walk there' },
  { key: 'Drag', label: 'look around' },
  { key: 'Scroll', label: 'zoom' }
];

const ControlsPanel: React.FC<ControlsPanelProps> = ({ isTouch }) => {
  const [open, setOpen] = useState(true);
  const hints = isTouch ? TOUCH_HINTS : POINTER_HINTS;

  // Get out of the way once they have had a chance to read it. The button
  // stays, so it is recoverable rather than gone.
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3"
            style={{ maxWidth: 'calc(100vw - 32px)' }}
          >
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center items-center">
              {hints.map((hint) => (
                <div key={hint.key} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="bg-gradient-to-br from-primary to-secondary text-white px-2 py-0.5 rounded-md text-xs font-semibold">
                    {hint.key}
                  </span>
                  <span className="text-xs text-gray-600">{hint.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        className="bg-white/90 backdrop-blur-md rounded-full shadow-md text-xs font-semibold text-gray-700 px-4 py-1.5"
        // 44px is the smallest thing a finger reliably hits.
        style={{ minHeight: '32px' }}
      >
        {open ? 'Hide controls' : 'Controls'}
      </button>
    </div>
  );
};

export default ControlsPanel;
