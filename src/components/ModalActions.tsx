import React from 'react';

type ButtonVariant = 'blue' | 'red' | 'green' | 'orange' | 'amber' | 'purple';

interface ModalActionsProps {
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  confirmDisabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  blue:   'bg-blue-600 hover:bg-blue-700',
  red:    'bg-red-600 hover:bg-red-700',
  green:  'bg-green-600 hover:bg-green-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  amber:  'bg-amber-600 hover:bg-amber-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

export function ModalActions({
  onConfirm, onCancel, confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'blue',
  confirmDisabled,
}: ModalActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`flex-1 text-white font-medium py-2 rounded-lg transition disabled:opacity-40 ${variantClasses[variant]}`}
      >
        {confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
