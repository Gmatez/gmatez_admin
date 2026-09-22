'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/fields';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireReason?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  requireReason,
  pending,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const blocked = Boolean(requireReason && reason.trim().length < 3);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-stone-200 bg-white p-5 shadow-lg dark:border-stone-700 dark:bg-stone-950">
          <Dialog.Title className="text-lg font-semibold text-stone-950 dark:text-stone-50">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            {description}
          </Dialog.Description>
          {requireReason ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="confirm-reason">Reason</Label>
              <Textarea
                id="confirm-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                required
              />
            </div>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={pending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              disabled={pending || blocked}
              onClick={() => onConfirm(reason.trim())}
            >
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
