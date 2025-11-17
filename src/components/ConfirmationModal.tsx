import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          titleColor: 'var(--neon-pink)',
          confirmButton: 'danger-action',
          icon: '🗑️'
        };
      case 'warning':
        return {
          titleColor: 'var(--neon-orange)',
          confirmButton: 'secondary-action',
          icon: '⚠️'
        };
      default:
        return {
          titleColor: 'var(--neon-blue)',
          confirmButton: 'primary-action',
          icon: '💡'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="confirmation-modal" onClick={onClose}>
      <div className="confirmation-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <span className="confirmation-icon">{styles.icon}</span>
          <h3 className="confirmation-title" style={{ color: styles.titleColor }}>
            {title}
          </h3>
        </div>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-buttons">
          <button 
            className={`secondary-action ${styles.confirmButton === 'danger-action' ? 'secondary-action' : ''}`}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={styles.confirmButton}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;