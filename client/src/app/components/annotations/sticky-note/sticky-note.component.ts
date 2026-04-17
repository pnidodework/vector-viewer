import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Annotation } from '../../../models/annotation.model';

@Component({
  selector: 'app-sticky-note',
  templateUrl: './sticky-note.component.html',
  styleUrls: ['./sticky-note.component.css'],
})
export class StickyNoteComponent {
  @Input() annotation!: Annotation;
  @Input() index = 0;
  @Output() textChanged = new EventEmitter<{ index: number; text: string }>();
  @Output() deleted = new EventEmitter<number>();
  @Output() colorChanged = new EventEmitter<{ index: number; color: string }>();

  colors = ['#FFEB3B', '#FF9800', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'];
  showColorPicker = false;

  onTextChange(text: string): void {
    this.textChanged.emit({ index: this.index, text });
  }

  onDelete(): void {
    this.deleted.emit(this.index);
  }

  toggleColorPicker(): void {
    this.showColorPicker = !this.showColorPicker;
  }

  selectColor(color: string): void {
    this.colorChanged.emit({ index: this.index, color });
    this.showColorPicker = false;
  }
}
