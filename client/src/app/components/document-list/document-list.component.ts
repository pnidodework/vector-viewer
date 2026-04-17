import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { FileInfo } from '../../models/file-info.model';
import { FileService } from '../../services/file.service';
import { ViewerStateService } from '../../services/viewer-state.service';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css'],
})
export class DocumentListComponent implements OnInit, OnDestroy {
  files: FileInfo[] = [];
  selectedFileId: string | null = null;
  selectedIds = new Set<string>();
  multiSelectMode = false;

  private subs: Subscription[] = [];

  constructor(
    private fileService: FileService,
    private viewerState: ViewerStateService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
    this.subs.push(
      this.viewerState.currentFile$.subscribe((file) => {
        this.selectedFileId = file?._id || null;
      }),
      this.viewerState.files$.subscribe((files) => {
        this.files = files;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadFiles(): void {
    this.fileService.scanAssets().subscribe({
      next: () => {
        this.fileService.getFiles().subscribe((files) => {
          this.files = files;
          this.viewerState.setFiles(files);
          if (files.length > 0 && !this.selectedFileId) {
            this.selectFile(files[0]);
          }
        });
      },
      error: () => {
        this.fileService.getFiles().subscribe((files) => {
          this.files = files;
          this.viewerState.setFiles(files);
        });
      },
    });
  }

  selectFile(file: FileInfo): void {
    if (this.multiSelectMode) {
      this.toggleSelection(file._id);
    } else {
      this.viewerState.setCurrentFile(file);
    }
  }

  toggleSelection(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleMultiSelect(): void {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.selectedIds.clear();
    }
  }

  deleteSelected(): void {
    if (this.selectedIds.size === 0) return;
    const ids = Array.from(this.selectedIds);
    if (!confirm(`Delete ${ids.length} file(s)?`)) return;

    this.fileService.batchDelete(ids).subscribe(() => {
      this.selectedIds.clear();
      this.loadFiles();
    });
  }

  deleteFile(file: FileInfo, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete "${file.displayName}"?`)) return;

    this.fileService.deleteFile(file._id).subscribe(() => {
      if (this.selectedFileId === file._id) {
        this.viewerState.setCurrentFile(null);
      }
      this.loadFiles();
    });
  }

  onDrop(event: CdkDragDrop<FileInfo[]>): void {
    moveItemInArray(this.files, event.previousIndex, event.currentIndex);
    const reorderPayload = this.files.map((f, i) => ({ id: f._id, sortOrder: i }));
    this.fileService.reorder(reorderPayload).subscribe();
    this.viewerState.setFiles([...this.files]);
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf': return '&#128196;';
      case 'tiff': return '&#128247;';
      case 'jpg': return '&#128444;';
      default: return '&#128196;';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  navigatePrev(): void {
    this.viewerState.navigateToPreviousDocument();
  }

  navigateNext(): void {
    this.viewerState.navigateToNextDocument();
  }
}
