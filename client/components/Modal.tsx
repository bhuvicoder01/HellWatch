'use client';
import React, { useEffect } from 'react';

export const Modal = ({ 
  show=false, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  centered = true 
}:{show:boolean, onClose:any, title:any, children:any, footer:any, size?:'sm'|'md'|'lg'|'xl', centered?:any}) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const getSizeClass = () => {
    const sizes: Record<string, string> = {
      sm: 'modal-sm',
      md: '',
      lg: 'modal-lg',
      xl: 'modal-xl'
    };
    return sizes[size] || '';
  };

  return (
    <>
      <div 
        className="modal fade show d-block" 
        tabIndex={-1} 
        role="dialog"
        // style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <div 
          className={`modal-dialog ${getSizeClass()} ${centered ? 'modal-dialog-centered' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title">{title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body">
              {children}
            </div>
            
            {footer && (
              <div className="modal-footer border-0">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

