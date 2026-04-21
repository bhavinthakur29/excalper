import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function Modal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showCancel = true,
    customContent,
    isConfirming = false,
    isConfirmDisabled = false,
    destructive = false
}) {
    const handleOpenChange = (open) => {
        if (!open) {
            if (isConfirming) return;
            onCancel();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => {
                    if (isConfirming) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (isConfirming) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[min(60vh,360px)] overflow-y-auto text-sm text-muted-foreground">
                    {customContent ? customContent : <p className="text-foreground">{message}</p>}
                </div>
                <DialogFooter>
                    {showCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isConfirming}>
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isConfirming || isConfirmDisabled}
                        className={cn(!destructive && 'min-w-[7rem]')}
                    >
                        {isConfirming ? (
                            <span className="inline-flex items-center gap-2">
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                                    aria-hidden="true"
                                />
                                {confirmText}
                            </span>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
