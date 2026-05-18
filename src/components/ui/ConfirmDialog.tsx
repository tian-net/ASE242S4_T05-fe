import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function ConfirmDialog({ open, title = 'Confirmar', message, confirmLabel = 'Confirmar', variant = 'danger', onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onCancel} title={title}>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button variant={variant} onClick={onConfirm} disabled={loading}>{loading ? 'Procesando...' : confirmLabel}</Button>
            </div>
        </Modal>
    );
}
