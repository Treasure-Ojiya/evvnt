import { DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-event-card',
  imports: [DatePipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css',
})
export class EventCard {
  constructor(
    @Inject(MAT_DIALOG_DATA) public event: any,
    public dialogRef: MatDialogRef<EventCard>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
