import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-none bg-white shadow-2xl modal-content flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 no-print shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none p-1 h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-4 sm:px-6 py-6 overflow-y-auto print-no-padding flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
