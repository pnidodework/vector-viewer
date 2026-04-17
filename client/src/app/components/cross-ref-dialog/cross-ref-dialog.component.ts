import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CrossReferenceService } from '../../services/cross-reference.service';
import { ViewerStateService } from '../../services/viewer-state.service';
import { FileInfo } from '../../models/file-info.model';
import { CrossReference } from '../../models/cross-reference.model';

@Component({
  selector: 'app-cross-ref-dialog',
  templateUrl: './cross-ref-dialog.component.html',
  styleUrls: ['./cross-ref-dialog.component.css'],
})
export class CrossRefDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  currentFile: FileInfo | null = null;
  allFiles: FileInfo[] = [];
  availableFiles: FileInfo[] = [];
  crossRefs: CrossReference[] = [];
  selectedTargetId = '';
  label = '';

  constructor(
    private crossRefService: CrossReferenceService,
    private viewerState: ViewerStateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.currentFile = this.viewerState.currentFile;
      this.allFiles = this.viewerState.files;
      this.loadCrossRefs();
    }
  }

  loadCrossRefs(): void {
    if (!this.currentFile) return;
    this.crossRefService.getCrossReferences(this.currentFile._id).subscribe((refs) => {
      this.crossRefs = refs;
      this.updateAvailableFiles();
    });
  }

  private updateAvailableFiles(): void {
    if (!this.currentFile) return;
    const linkedIds = new Set<string>();
    linkedIds.add(this.currentFile._id);
    for (const ref of this.crossRefs) {
      const srcId = typeof ref.sourceFileId === 'string' ? ref.sourceFileId : ref.sourceFileId._id;
      const tgtId = typeof ref.targetFileId === 'string' ? ref.targetFileId : ref.targetFileId._id;
      linkedIds.add(srcId);
      linkedIds.add(tgtId);
    }
    this.availableFiles = this.allFiles.filter((f) => !linkedIds.has(f._id));
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  addLink(): void {
    if (!this.currentFile || !this.selectedTargetId) return;
    this.crossRefService
      .createCrossReference(this.currentFile._id, this.selectedTargetId, this.label)
      .subscribe(() => {
        this.selectedTargetId = '';
        this.label = '';
        this.loadCrossRefs();
      });
  }

  removeLink(refId: string): void {
    this.crossRefService.deleteCrossReference(refId).subscribe(() => {
      this.loadCrossRefs();
    });
  }

  navigateToRef(ref: CrossReference): void {
    const targetFile = typeof ref.targetFileId === 'string'
      ? this.allFiles.find((f) => f._id === ref.targetFileId)
      : (ref.targetFileId as FileInfo);

    const sourceFile = typeof ref.sourceFileId === 'string'
      ? this.allFiles.find((f) => f._id === ref.sourceFileId)
      : (ref.sourceFileId as FileInfo);

    const navTo = this.currentFile?._id === targetFile?._id ? sourceFile : targetFile;
    if (navTo) {
      this.viewerState.setCurrentFile(navTo);
      this.close();
    }
  }

  getLinkedFileName(ref: CrossReference): string {
    const srcId = typeof ref.sourceFileId === 'string' ? ref.sourceFileId : ref.sourceFileId._id;
    const tgtFile = typeof ref.targetFileId === 'string' ? null : ref.targetFileId;
    const srcFile = typeof ref.sourceFileId === 'string' ? null : ref.sourceFileId;

    if (srcId === this.currentFile?._id) {
      return tgtFile ? (tgtFile as FileInfo).displayName : 'Unknown';
    }
    return srcFile ? (srcFile as FileInfo).displayName : 'Unknown';
  }
}
