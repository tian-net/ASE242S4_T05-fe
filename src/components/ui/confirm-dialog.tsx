import { Button } from '\./Button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }: ConfirmDialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
                    <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
}
