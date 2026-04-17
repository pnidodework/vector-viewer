import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-crop-tool',
  templateUrl: './crop-tool.component.html',
  styleUrls: ['./crop-tool.component.css'],
})
export class CropToolComponent {
  @Input() canvasWidth = 800;
  @Input() canvasHeight = 600;
  @Input() active = false;
  @Output() cropApplied = new EventEmitter<CropRect>();
  @Output() cropCancelled = new EventEmitter<void>();

  isDragging = false;
  startX = 0;
  startY = 0;
  cropRect: CropRect = { x: 0, y: 0, width: 0, height: 0 };
  hasCrop = false;

  onMouseDown(event: MouseEvent): void {
    if (!this.active) return;
    const rect = (event.target as Element).getBoundingClientRect();
    this.startX = event.clientX - rect.left;
    this.startY = event.clientY - rect.top;
    this.isDragging = true;
    this.hasCrop = false;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const rect = (event.target as Element).closest('.crop-overlay')!.getBoundingClientRect();
    const curX = event.clientX - rect.left;
    const curY = event.clientY - rect.top;

    this.cropRect = {
      x: Math.min(this.startX, curX),
      y: Math.min(this.startY, curY),
      width: Math.abs(curX - this.startX),
      height: Math.abs(curY - this.startY),
    };
    this.hasCrop = true;
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  applyCrop(): void {
    if (this.cropRect.width > 10 && this.cropRect.height > 10) {
      this.cropApplied.emit({ ...this.cropRect });
    }
    this.reset();
  }

  cancel(): void {
    this.reset();
    this.cropCancelled.emit();
  }

  private reset(): void {
    this.cropRect = { x: 0, y: 0, width: 0, height: 0 };
    this.hasCrop = false;
  }
}
