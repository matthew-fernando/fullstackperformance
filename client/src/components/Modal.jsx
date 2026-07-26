import { X } from 'lucide-react';

function Modal({ title, onClose, children, footer })
{
    return (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export default Modal;