'use client';

import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            {title && (
              <h2 className="text-[11px] uppercase tracking-widest">{title}</h2>
            )}
            <button onClick={onClose} className="text-neutral-400 hover:text-black transition-colors ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
