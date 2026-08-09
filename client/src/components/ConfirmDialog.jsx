import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './UI';

export const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  const variantIcons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    primary: <AlertTriangle className="w-6 h-6 text-primary-500" />,
    success: <AlertTriangle className="w-6 h-6 text-emerald-500" />,
  };

  const bgVariants = {
    danger: 'bg-rose-50 border border-rose-100',
    primary: 'bg-primary-50 border border-primary-100',
    success: 'bg-emerald-50 border border-emerald-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform scale-100 transition-all duration-300 animate-zoom-in">
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
          <div className={`p-2 rounded-xl ${bgVariants[confirmVariant] || bgVariants.primary}`}>
            {variantIcons[confirmVariant] || variantIcons.primary}
          </div>
          <h3 className="font-semibold text-gray-800 text-base flex-1">{title}</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmDialog;
