
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-2 space-x-reverse">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;