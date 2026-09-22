import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { StatusBadge } from '@/components/status/status-badge';

describe('StatusBadge', () => {
  it('exposes the status as text', () => {
    render(<StatusBadge value="SUSPENDED" />);
    expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('keeps a destructive confirm disabled until a reason is entered', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="Suspend user"
        description="This suspends the account."
        confirmLabel="Suspend"
        destructive
        requireReason
        onOpenChange={() => undefined}
        onConfirm={onConfirm}
      />,
    );
    const button = screen.getByRole('button', { name: 'Suspend' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Reason'), 'abuse');
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onConfirm).toHaveBeenCalledWith('abuse');
  });
});
