'use client';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    isProcessing?: boolean;
    type?: 'alert' | 'confirm';
}

export default function Modal({ isOpen, title, message, onClose, onConfirm, confirmText = 'OK', isProcessing, type = 'confirm' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: type === 'confirm' ? 'var(--danger)' : 'var(--foreground)' }}>
                    {title}
                </h3>
                <p style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {(type === 'confirm' || type === 'alert') && (
                        <button
                            onClick={onClose}
                            className="btn btn-outline"
                            disabled={isProcessing}
                            type="button"
                        >
                            {type === 'alert' ? '閉じる' : 'キャンセル'}
                        </button>
                    )}
                    {type === 'confirm' && onConfirm && (
                        <button
                            onClick={onConfirm}
                            style={{
                                backgroundColor: 'var(--danger)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: isProcessing ? 0.7 : 1
                            }}
                            disabled={isProcessing}
                            type="button"
                        >
                            {isProcessing ? '処理中...' : confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
