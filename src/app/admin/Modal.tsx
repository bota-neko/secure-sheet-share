'use client';

import React from 'react';

interface ModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    children?: React.ReactNode;
    onClose: () => void;
    footer?: React.ReactNode;
}

export default function Modal({ isOpen, title, description, children, onClose, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    {title}
                </h3>

                {description && <p style={{ marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>{description}</p>}
                {children && <div style={{ marginBottom: '1.5rem' }}>{children}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {footer ? footer : (
                        <button className="btn btn-primary" onClick={onClose}>閉じる</button>
                    )}
                </div>
            </div>
        </div>
    );
}
