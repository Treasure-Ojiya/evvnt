import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" paints the confirm button red (delete). Defaults to "brand".
  tone?: 'danger' | 'brand';
}

// Closes with `true` when the user confirms, `false` (or undefined) otherwise.
@Component({
  selector: 'app-confirm-modal',
  imports: [NgClass],
  templateUrl: './confirm-modal.html',
})
export class ConfirmModal {
  private dialogRef = inject<MatDialogRef<ConfirmModal, boolean>>(MatDialogRef);
  data = inject<ConfirmModalData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
