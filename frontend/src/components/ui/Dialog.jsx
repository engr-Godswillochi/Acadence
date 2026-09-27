import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './dialog.css';

export function Dialog({ title, description, icon: Icon, children, onClose, busy = false }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    // JSDOM does not implement the native dialog methods used by browsers.
    // The open attribute preserves a usable, testable fallback there.
    if (typeof element.showModal === 'function') element.showModal();
    else element.setAttribute('open', '');
    return () => {
      if (typeof element.close === 'function') element.close();
      else element.removeAttribute('open');
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className="workspace-dialog" aria-modal="true" aria-busy={busy || undefined} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="dialog-heading">
      <div className="dialog-title-row">{Icon && <span className="dialog-symbol"><Icon size={20} aria-hidden="true" /></span>}<h2 id={titleId}>{title}</h2><button type="button" className="dialog-close" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
      {description && <p id={descriptionId}>{description}</p>}
    </header>
    {children}
  </dialog>, document.body);
}
