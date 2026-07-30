import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ open, onClose, children, maxHeight = '80vh' }: BottomSheetProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className="relative z-10 w-full max-w-(--width-app) touch-pan-y overflow-y-auto rounded-t-[24px] bg-card pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-elevated"
            style={{ maxHeight }}
          >
            <div className="sticky top-0 flex justify-center bg-card pb-1 pt-2.5">
              <div className="h-1.5 w-10 rounded-full bg-border" />
            </div>
            <div className="px-5 pb-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
