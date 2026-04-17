import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-stamp-selector',
  templateUrl: './stamp-selector.component.html',
  styleUrls: ['./stamp-selector.component.css'],
})
export class StampSelectorComponent {
  @Input() visible = false;
  @Output() stampSelected = new EventEmitter<string>();
  @Output() visibleChange = new EventEmitter<boolean>();

  standardStamps = ['APPROVED', 'REJECTED', 'DRAFT', 'CONFIDENTIAL', 'FINAL', 'COPY', 'VOID', 'RECEIVED', 'REVIEWED', 'PENDING'];
  customStampText = '';

  selectStamp(stamp: string): void {
    this.stampSelected.emit(stamp);
    this.close();
  }

  addCustomStamp(): void {
    if (this.customStampText.trim()) {
      this.stampSelected.emit(this.customStampText.trim().toUpperCase());
      this.customStampText = '';
      this.close();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
