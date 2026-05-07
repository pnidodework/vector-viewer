import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewerStateService, ActiveTool } from '../../services/viewer-state.service';
import { UndoRedoService } from '../../services/undo-redo.service';
import { AutoSaveService } from '../../services/auto-save.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Output() openExportDialog = new EventEmitter<void>();
  @Output() openCrossRefDialog = new EventEmitter<void>();

  activeTool: ActiveTool = 'select';
  canUndo = false;
  canRedo = false;
  brightness = 100;
  contrast = 100;
  showImageAdjust = false;
  showStampSelector = false;
  selectedStamp = 'APPROVED';

  stampOptions = ['APPROVED', 'REJECTED', 'DRAFT', 'CONFIDENTIAL', 'FINAL', 'COPY', 'VOID', 'RECEIVED'];

  private subs: Subscription[] = [];

  constructor(
    public viewerState: ViewerStateService,
    public undoRedoService: UndoRedoService,
    private autoSaveService: AutoSaveService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.viewerState.activeTool$.subscribe((t) => (this.activeTool = t)),
      this.undoRedoService.canUndo$.subscribe((v) => (this.canUndo = v)),
      this.undoRedoService.canRedo$.subscribe((v) => (this.canRedo = v)),
      this.viewerState.brightness$.subscribe((b) => (this.brightness = b)),
      this.viewerState.contrast$.subscribe((c) => (this.contrast = c))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  setTool(tool: ActiveTool): void {
    this.viewerState.setActiveTool(tool);
    this.showStampSelector = false;
  }

  selectStampTool(): void {
    this.showStampSelector = !this.showStampSelector;
    if (this.showStampSelector) {
      this.viewerState.setActiveTool('stamp');
    }
  }

  selectStamp(stamp: string): void {
    this.selectedStamp = stamp;
    this.showStampSelector = false;
    this.viewerState.setSelectedStamp(stamp);
    this.viewerState.setActiveTool('stamp');
  }

  zoomIn(): void { this.viewerState.zoomIn(); }
  zoomOut(): void { this.viewerState.zoomOut(); }
  fitToScreen(): void { this.viewerState.fitToScreen(); }
  actualSize(): void { this.viewerState.actualSize(); }

  rotate90(): void { this.viewerState.rotate90(); }
  rotate180(): void { this.viewerState.rotate180(); }
  rotate270(): void { this.viewerState.rotate270(); }

  undo(): void { this.undoRedoService.undo(); }
  redo(): void { this.undoRedoService.redo(); }

  toggleImageAdjust(): void {
    this.showImageAdjust = !this.showImageAdjust;
  }

  onBrightnessChange(value: number): void {
    this.viewerState.setBrightness(value);
  }

  onContrastChange(value: number): void {
    this.viewerState.setContrast(value);
  }

  save(): void {
    this.autoSaveService.save();
  }

  onExport(): void {
    this.openExportDialog.emit();
  }
}
