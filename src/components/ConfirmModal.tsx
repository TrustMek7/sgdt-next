import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { ModalActions } from './ModalActions';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  heading: string;
  detail?: string;
  warning?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm,
  title = 'Confirmar Eliminación',
  heading, detail,
  warning,
  confirmLabel = 'Eliminar',
  confirmDisabled,
  children,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">{heading}</p>
            {detail && <p className="text-sm text-red-700 mt-1">{detail}</p>}
            {children}
            {warning && <p className="text-sm text-red-700 mt-2">{warning}</p>}
          </div>
        </div>
        <ModalActions
          onConfirm={onConfirm}
          onCancel={onClose}
          confirmLabel={confirmLabel}
          variant="red"
          confirmDisabled={confirmDisabled}
        />
      </div>
    </Modal>
  );
}
