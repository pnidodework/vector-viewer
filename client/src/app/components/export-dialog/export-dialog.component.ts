import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { ViewerStateService } from '../../services/viewer-state.service';

@Component({
  selector: 'app-export-dialog',
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.css'],
})
export class ExportDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  format = 'pdf';
  quality = 80;

  constructor(
    private exportService: ExportService,
    private viewerState: ViewerStateService
  ) {}

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  export(): void {
    const file = this.viewerState.currentFile;
    if (!file) return;

    this.exportService.exportFiles([file._id], this.format, this.quality);
    this.close();
  }
}
