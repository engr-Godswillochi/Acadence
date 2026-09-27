import { AlertTriangle } from 'lucide-react';
import { Dialog } from './Dialog.jsx';

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  busy = false,
  error = '',
  icon = AlertTriangle,
}) {
  return (
    <Dialog title={title} description={description} icon={icon} onClose={onClose} busy={busy}>
      <div className="dialog-confirm">
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <div className="dialog-actions dialog-confirm-actions">
          <button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </Dialog>
  );
}
